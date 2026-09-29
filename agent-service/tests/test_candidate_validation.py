"""Pre-batch S3 validation safety-gate coverage."""
from __future__ import annotations

from copy import deepcopy

import pytest

from app.agents import validation_agent
from app.schemas.common import BatchCandidate
from app.schemas.validation import ValidationInput


def _input(*, max_weight_kg: float = 1000, max_volume_m3: float = 12) -> ValidationInput:
    return ValidationInput(
        workflow_id="wf-candidate-001",
        proposed_allocation={
            "proposed": {
                "driver_id": "DRV-001",
                "vehicle_id": "VEH-001",
                "max_weight_kg": max_weight_kg,
                "max_volume_m3": max_volume_m3,
            },
            "candidate": {
                "warehouse_id": "warehouse-001",
                "package_ids": ["package-heavy", "package-fragile"],
            },
        },
        batch=BatchCandidate(
            order_ids=["order-heavy", "order-fragile"],
            vehicle_id="VEH-001",
        ),
    )


def _context() -> dict:
    return {
        "warehouseId": "warehouse-001",
        "vehicleId": "VEH-001",
        "maxWeightKg": 1000,
        "maxVolumeM3": 12,
        "totalWeightKg": 700,
        "totalVolumeM3": 7,
        "requestedPackageIds": ["package-heavy", "package-fragile"],
        "packages": [
            {
                "packageId": "package-heavy", "orderId": "order-heavy",
                "warehouseId": "warehouse-001", "storageZoneCode": "A1",
                "trackingCode": "HEAVY", "status": "Available",
                "weightKg": 600, "volumeM3": 6, "isFragile": False,
            },
            {
                "packageId": "package-fragile", "orderId": "order-fragile",
                "warehouseId": "warehouse-001", "storageZoneCode": "A1",
                "trackingCode": "FRAGILE", "status": "Available",
                "weightKg": 100, "volumeM3": 1, "isFragile": True,
            },
        ],
        "planningResult": "PASS",
        "planningIssues": [],
        "plannedItems": [
            {"packageId": "package-heavy", "loadSequence": 1},
            {"packageId": "package-fragile", "loadSequence": 2},
        ],
    }


def _capacity(context: dict, *_args: object) -> dict:
    return {
        "batch_id": "candidate", "vehicle_id": context["vehicleId"],
        "total_weight_kg": context["totalWeightKg"], "total_volume_m3": context["totalVolumeM3"],
        "max_weight_kg": context["maxWeightKg"], "max_volume_m3": context["maxVolumeM3"],
        "within_weight_capacity": context["totalWeightKg"] <= context["maxWeightKg"],
        "within_volume_capacity": context["totalVolumeM3"] <= context["maxVolumeM3"],
        "backend_totals_match": True,
    }


def _stock(context: dict, warehouse_id: str) -> dict:
    packages = context["packages"]
    present = len(packages) == len(context["requestedPackageIds"])
    available = all(package["status"] == "Available" for package in packages)
    warehouse_match = all(package["warehouseId"] == warehouse_id for package in packages)
    return {
        "batch_id": "candidate", "warehouse_id": warehouse_id, "batch_warehouse_id": warehouse_id,
        "expected_status": "Available", "packages": [], "all_packages_present": present,
        "all_belong_to_expected_warehouse": warehouse_match, "all_belong_to_batch": present,
        "all_in_expected_dispatch_state": available, "none_dispatched": all(package["status"] != "Dispatched" for package in packages),
        "valid": present and available and warehouse_match,
    }


def _compatibility(context: dict) -> dict:
    return {
        "batch_id": "candidate",
        "load_sequence_valid": context["planningResult"] == "PASS",
        "fragile_not_under_heavy": context["planningResult"] == "PASS",
        "valid": context["planningResult"] == "PASS",
    }


def _install_tools(monkeypatch: pytest.MonkeyPatch, context: dict) -> None:
    monkeypatch.setattr(validation_agent, "fetch_candidate_validation_context", lambda *_: deepcopy(context))
    monkeypatch.setattr(validation_agent, "candidate_capacity_calculator", _capacity)
    monkeypatch.setattr(validation_agent, "candidate_stock_query", _stock)
    monkeypatch.setattr(validation_agent, "candidate_compatibility_rules", _compatibility)
    monkeypatch.setattr(validation_agent, "schema_validator", lambda *_: True)
    monkeypatch.setattr(validation_agent, "_ollama_explanation", lambda *_: "Deterministic facts summarized.")


def _rule(output: object, name: str) -> bool:
    return next(rule.passed for rule in output.rule_results if rule.rule == name)


def test_valid_candidate_passes_before_any_dispatch_batch_exists(monkeypatch: pytest.MonkeyPatch):
    _install_tools(monkeypatch, _context())

    output = validation_agent._run(_input())

    assert output.result == "PASS"
    assert output.approved_batch is not None
    assert all(rule.passed for rule in output.rule_results)


@pytest.mark.parametrize(
    ("capacity_field", "rule_name"),
    [("maxWeightKg", "within_weight_capacity"), ("maxVolumeM3", "within_volume_capacity")],
)
def test_unsafe_well_formed_candidate_fails_through_s3_agent(
    monkeypatch: pytest.MonkeyPatch, capacity_field: str, rule_name: str,
):
    context = _context()
    context[capacity_field] = 500 if capacity_field == "maxWeightKg" else 5
    _install_tools(monkeypatch, context)

    output = validation_agent._run(_input())

    assert output.result == "FAIL"
    assert output.approved_batch is None
    assert _rule(output, rule_name) is False


@pytest.mark.parametrize("mutation", ["missing", "wrong_warehouse", "unsafe_plan"])
def test_candidate_stock_or_load_plan_failure_is_fail(
    monkeypatch: pytest.MonkeyPatch, mutation: str,
):
    context = _context()
    if mutation == "missing":
        context["packages"] = context["packages"][:1]
    elif mutation == "wrong_warehouse":
        context["packages"][1]["warehouseId"] = "warehouse-other"
    else:
        context["planningResult"] = "REVISE"
        context["planningIssues"] = ["Fragile placement is unsafe."]
        context["plannedItems"] = []
    _install_tools(monkeypatch, context)

    output = validation_agent._run(_input())

    assert output.result == "FAIL"
    assert output.approved_batch is None


def test_missing_s2_capacity_is_revise_and_does_not_call_backend(monkeypatch: pytest.MonkeyPatch):
    inp = _input()
    inp.proposed_allocation["proposed"].pop("max_weight_kg")
    monkeypatch.setattr(validation_agent, "fetch_candidate_validation_context", pytest.fail)

    output = validation_agent._run(inp)

    assert output.result == "REVISE"
    assert output.approved_batch is None
    assert any("max_weight_kg" in reason for reason in output.rejection_reasons)


def test_ollama_failure_preserves_candidate_fail_decision(monkeypatch: pytest.MonkeyPatch):
    context = _context()
    context["maxWeightKg"] = 500
    _install_tools(monkeypatch, context)
    monkeypatch.setattr(validation_agent, "_ollama_explanation", lambda *_: (_ for _ in ()).throw(TimeoutError()))

    output = validation_agent._run(_input())

    assert output.result == "FAIL"
    assert output.explanation_source == "deterministic_fallback"
    assert _rule(output, "within_weight_capacity") is False
