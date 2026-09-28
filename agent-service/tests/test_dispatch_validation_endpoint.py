from __future__ import annotations

from app import main
from app.schemas.common import BatchCandidate
from app.schemas.validation import ValidationInput, ValidationOutput


def _request() -> ValidationInput:
    return ValidationInput(
        workflow_id="s3-dispatch-validation-batch-001",
        proposed_allocation={"proposed": {"vehicle_id": "VEH-001"}},
        batch=BatchCandidate(
            order_ids=["order-001"],
            vehicle_id="VEH-001",
            batch_id="batch-001",
        ),
    )


def test_dispatch_validation_endpoint_runs_only_the_s3_validation_agent(monkeypatch):
    expected = ValidationOutput(
        workflow_id="s3-dispatch-validation-batch-001",
        result="PASS",
        explanation="All deterministic checks passed.",
        explanation_source="deterministic_fallback",
    )
    calls: list[ValidationInput] = []

    def fake_run(request: ValidationInput) -> ValidationOutput:
        calls.append(request)
        return expected

    monkeypatch.setattr(main, "run_dispatch_validation", fake_run)

    response = main.validate_dispatch(_request())

    assert response == expected
    assert calls == [_request()]
