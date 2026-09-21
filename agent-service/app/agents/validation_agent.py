# [S3] Load & Dispatch Validation agent — deterministic safety gate.
#
# SKELETON STUB: `_run` returns deterministic, schema-valid dummy output. Phase 3
# (owner S3) replaces it with the real rule engine whose allow-listed tools are:
#   capacity calculator · package-compatibility rules engine · warehouse stock
#   query · schema validator. Rules decide PASS/FAIL/REVISE — never the LLM.
from __future__ import annotations

from app.schemas.common import AuditEntry, BatchCandidate, WorkflowStatus
from app.schemas.validation import RuleResult, ValidationInput, ValidationOutput
from app.state import WorkflowState


def _build_input(state: WorkflowState) -> ValidationInput:
    allocation = state.get("allocation") or {}
    proposed = allocation.get("proposed", {})
    order_ids = (state.get("triage") or {}).get("validated_order_ids", [])
    return ValidationInput(
        workflow_id=state["workflow_id"],
        proposed_allocation=allocation,
        batch=BatchCandidate(
            order_ids=order_ids,
            vehicle_id=proposed.get("vehicle_id", "veh-unknown"),
        ),
    )


def _run(inp: ValidationInput) -> ValidationOutput:
    """STUB [S3] — replace with the real validation rule engine in Phase 3."""
    rules = [
        RuleResult(rule="within_weight_capacity", passed=True),
        RuleResult(rule="within_volume_capacity", passed=True),
        RuleResult(rule="fragile_not_under_heavy", passed=True),
        RuleResult(rule="stock_present_at_warehouse", passed=True),
    ]
    all_pass = all(r.passed for r in rules)
    return ValidationOutput(
        workflow_id=inp.workflow_id,
        result="PASS" if all_pass else "FAIL",
        rule_results=rules,
        approved_batch=inp.batch if all_pass else None,
        rejection_reasons=[] if all_pass else ["one or more rules failed"],
    )


def validation_node(state: WorkflowState) -> dict:
    inp = _build_input(state)
    out = _run(inp)
    return {
        "status": WorkflowStatus.VALIDATING.value,
        "validation": out.model_dump(),
        "audit": [AuditEntry(
            step="validate", agent="validation",
            summary=f"Validation {out.result} ({sum(r.passed for r in out.rule_results)}"
                    f"/{len(out.rule_results)} rules passed).",
            tool_calls=["capacity_calculator", "compatibility_rules", "stock_query", "schema_validator"],
        ).model_dump()],
    }
