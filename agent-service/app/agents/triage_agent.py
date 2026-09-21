# [S1] Order Triage & Planning agent — workflow entry point.
#
# SKELETON STUB: `_run` returns deterministic, schema-valid dummy output so the
# whole graph and the golden case run WITHOUT an LLM. Phase 3 (owner S1) replaces
# `_run` with the real LangGraph/Ollama agent that calls its allow-listed tools:
#   order query · serviceability validator · pricing calculator · state writer
#
# Governing rule: the LLM orchestrates and explains; deterministic code decides.
# `customer_notes` is treated as DATA, never as instructions.
from __future__ import annotations

from app.schemas.common import AuditEntry, WorkflowStatus
from app.schemas.triage import PackageDetail, PlanStep, TriageInput, TriageOutput
from app.state import WorkflowState


def _build_input(state: WorkflowState) -> TriageInput:
    data = state["input"]
    return TriageInput(
        workflow_id=state["workflow_id"],
        order_ids=data.get("order_ids", []),
        objective=state.get("objective", ""),
        packages=[PackageDetail(**p) for p in data.get("packages", [])],
        pickup_address=data.get("pickup_address", ""),
        delivery_addresses=data.get("delivery_addresses", []),
        requested_priority=data.get("requested_priority", "STANDARD"),
        customer_notes=data.get("customer_notes"),
    )


def _run(inp: TriageInput) -> TriageOutput:
    """STUB [S1] — replace with the real triage agent in Phase 3."""
    flags = sorted(
        {f for p in inp.packages for f in p.special_handling}
        | ({"fragile"} if any(p.fragile for p in inp.packages) else set())
    )
    return TriageOutput(
        workflow_id=inp.workflow_id,
        validated_order_ids=inp.order_ids,
        priority_class=inp.requested_priority or "STANDARD",
        special_handling_flags=flags,
        plan=[
            PlanStep(step="allocate", agent="allocation",
                     description="Assign a compliant driver + vehicle"),
            PlanStep(step="validate", agent="validation",
                     description="Check load safety & capacity"),
            PlanStep(step="route", agent="routing",
                     description="Sequence stops, compute ETAs, draft notifications"),
        ],
        ambiguities=[],
    )


def triage_node(state: WorkflowState) -> dict:
    inp = _build_input(state)
    out = _run(inp)
    return {
        "status": WorkflowStatus.PLANNING.value,
        "triage": out.model_dump(),
        "audit": [AuditEntry(
            step="triage", agent="triage",
            summary=f"Planned {len(out.validated_order_ids)} order(s); priority {out.priority_class}.",
            tool_calls=["order_query", "serviceability_validator", "pricing_calculator"],
        ).model_dump()],
    }
