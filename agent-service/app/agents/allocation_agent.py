# [S2] Resource Allocation agent.
#
# SKELETON STUB: `_run` returns deterministic, schema-valid dummy output. Phase 3
# (owner S2) replaces it with the real agent whose allow-listed tools are:
#   fleet availability query · driver workload query · compliance rules checker ·
#   capacity lookup. The compliance engine runs BEFORE the LLM ranks, so the model
#   only ever chooses among a pre-filtered legal set.
from __future__ import annotations

from app.schemas.allocation import AllocationCandidate, AllocationInput, AllocationOutput
from app.schemas.common import AuditEntry, WorkflowStatus
from app.state import WorkflowState


def _build_input(state: WorkflowState) -> AllocationInput:
    data = state["input"]
    packages = data.get("packages", [])
    total_w = sum(float(p.get("weight_kg", 0)) for p in packages)
    total_v = sum(float(p.get("volume_m3", 0)) for p in packages)
    return AllocationInput(
        workflow_id=state["workflow_id"],
        plan_step="allocate",
        total_weight_kg=total_w,
        total_volume_m3=total_v,
        vehicle_type=data.get("vehicle_type"),
        delivery_window_start=data.get("delivery_window_start", ""),
        delivery_window_end=data.get("delivery_window_end", ""),
    )


def _run(inp: AllocationInput) -> AllocationOutput:
    """STUB [S2] — replace with the real allocation agent in Phase 3."""
    return AllocationOutput(
        workflow_id=inp.workflow_id,
        proposed=AllocationCandidate(
            driver_id="drv-nuwan",
            vehicle_id="veh-van-01",
            reasons=["Available in window", "Capacity fits load", "Compliance OK"],
            constraints_checked=["driver_hours", "vehicle_capacity", "serviceability"],
        ),
        alternatives=[AllocationCandidate(
            driver_id="drv-backup",
            vehicle_id="veh-van-02",
            reasons=["Backup within window"],
            constraints_checked=["driver_hours", "vehicle_capacity"],
        )],
        compliance_passed=True,
    )


def allocation_node(state: WorkflowState) -> dict:
    inp = _build_input(state)
    out = _run(inp)
    return {
        "status": WorkflowStatus.ALLOCATING.value,
        "allocation": out.model_dump(),
        "audit": [AuditEntry(
            step="allocate", agent="allocation",
            summary=f"Proposed {out.proposed.driver_id} + {out.proposed.vehicle_id} "
                    f"(compliance_passed={out.compliance_passed}).",
            tool_calls=["fleet_availability", "driver_workload", "compliance_checker", "capacity_lookup"],
        ).model_dump()],
    }
