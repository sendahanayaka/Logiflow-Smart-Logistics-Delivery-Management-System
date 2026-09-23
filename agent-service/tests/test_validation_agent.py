from __future__ import annotations

import pytest

from app.agents import validation_agent
from app.schemas.common import BatchCandidate
from app.schemas.validation import ValidationInput


def _input(*, batch_id: str | None = "batch-001") -> ValidationInput:
    return ValidationInput(
        workflow_id="wf-validation-001",
        proposed_allocation={
            "proposed": {
                "driver_id": "DRV-TEST-001",
                "vehicle_id": "VEH-TEST-001",
            }
        },
        batch=BatchCandidate(
            order_ids=["order-001"],
            vehicle_id="VEH-TEST-001",
            batch_id=batch_id,
        ),
    )


def _context() -> dict:
    return {
        "batchId": "batch-001",
        "warehouseId": "warehouse-001",
        "vehicleId": "VEH-TEST-001",
        "batchStatus": "Reserved",
        "maxWeightKg": 1000,
        "maxVolumeM3": 12,
        "totalWeightKg": 700,
        "totalVolumeM3": 7,
        "packages": [],
    }


def _capacity(*_args, **_kwargs) -> dict:
    return {
        "batch_id": "batch-001",
        "vehicle_id": "VEH-TEST-001",
        "total_weight_kg": 700,
        "total_volume_m3": 7,
        "max_weight_kg": 1000,
        "max_volume_m3": 12,
        "within_weight_capacity": True,
        "within_volume_capacity": True,
        "backend_totals_match": True,
    }


def _stock(*_args, **_kwargs) -> dict:
    return {
        "batch_id": "batch-001",
        "warehouse_id": "warehouse-001",
        "batch_warehouse_id": "warehouse-001",
        "expected_status": "Reserved",
        "packages": [],
        "all_packages_present": True,
        "all_belong_to_expected_warehouse": True,
        "all_belong_to_batch": True,
        "all_in_expected_dispatch_state": True,
        "none_dispatched": True,
        "valid": True,
    }


def _compatibility(*_args, **_kwargs) -> dict:
    return {
        "batch_id": "batch-001",
        "load_sequence_valid": True,
        "fragile_not_under_heavy": True,
        "valid": True,
    }


def _patch_passing_tools(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(validation_agent, "fetch_batch_validation_context", lambda *_: _context())
    monkeypatch.setattr(validation_agent, "capacity_calculator", _capacity)
    monkeypatch.setattr(validation_agent, "warehouse_stock_query", _stock)
    monkeypatch.setattr(validation_agent, "compatibility_rules", _compatibility)
    monkeypatch.setattr(validation_agent, "schema_validator", lambda *_: True)
    monkeypatch.setattr(
        validation_agent,
        "_ollama_explanation",
        lambda *_: (_ for _ in ()).throw(RuntimeError("Ollama unavailable")),
    )


def test_run_returns_pass_only_when_every_deterministic_rule_passes(
    monkeypatch: pytest.MonkeyPatch,
):
    _patch_passing_tools(monkeypatch)

    output = validation_agent._run(_input())

    assert output.result == "PASS"
    assert output.approved_batch is not None
    assert all(rule.passed for rule in output.rule_results)
    assert output.explanation == (
        "All deterministic S3 load, stock, capacity, and compatibility checks passed."
    )


def test_run_returns_fail_for_complete_context_with_hard_capacity_violation(
    monkeypatch: pytest.MonkeyPatch,
):
    _patch_passing_tools(monkeypatch)
    capacity = _capacity()
    capacity["within_weight_capacity"] = False
    monkeypatch.setattr(validation_agent, "capacity_calculator", lambda *_: capacity)

    output = validation_agent._run(_input())

    assert output.result == "FAIL"
    assert output.approved_batch is None
    assert "weight exceeds" in output.explanation.lower()
    assert not next(
        rule for rule in output.rule_results if rule.rule == "within_weight_capacity"
    ).passed


def test_run_returns_revise_for_missing_persisted_batch_identifier(
    monkeypatch: pytest.MonkeyPatch,
):
    _patch_passing_tools(monkeypatch)

    output = validation_agent._run(_input(batch_id=None))

    assert output.result == "REVISE"
    assert output.approved_batch is None
    assert len(output.rule_results) == 1
    assert output.rule_results[0].rule == "input_complete"
    assert "batch_id" in output.rejection_reasons[0]


def test_graph_validation_router_only_routes_deterministic_pass():
    pytest.importorskip("langgraph")
    from app.graph import _after_validation

    assert _after_validation({"validation": {"result": "PASS"}}) == "route"
    assert _after_validation({"validation": {"result": "FAIL"}}) == "safe_failure"
    assert _after_validation({"validation": {"result": "REVISE"}}) == "safe_failure"
