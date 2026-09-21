# [S4] Route Planning & Notification agent — last agent before the human gate.
#
# SKELETON STUB: `_run` returns deterministic, schema-valid dummy output, and sets
# the workflow to AWAITING_APPROVAL so the graph pauses at the human gate. Phase 3
# (owner S4 — this repo's author) replaces `_run` with the real agent whose
# allow-listed tools are: distance-matrix API (via backend) · route sequencer
# (heuristic) · ETA calculator · notification composer.
from __future__ import annotations

from app.schemas.common import AuditEntry, BatchCandidate, WorkflowStatus
from app.schemas.routing import (
    NotificationPlan,
    RoutingInput,
    RoutingOutput,
    SequencedStop,
    Stop,
)
from app.state import WorkflowState


def _build_input(state: WorkflowState) -> RoutingInput:
    data = state["input"]
    validation = state.get("validation") or {}
    allocation = (state.get("allocation") or {}).get("proposed", {})
    approved = validation.get("approved_batch") or {
        "order_ids": (state.get("triage") or {}).get("validated_order_ids", []),
        "vehicle_id": allocation.get("vehicle_id", "veh-unknown"),
    }
    stops = [Stop(**s) for s in data.get("stops", [])]
    return RoutingInput(
        workflow_id=state["workflow_id"],
        approved_batch=BatchCandidate(**approved),
        driver_id=allocation.get("driver_id", "drv-unknown"),
        vehicle_id=allocation.get("vehicle_id", "veh-unknown"),
        stops=stops,
    )


def _run(inp: RoutingInput) -> RoutingOutput:
    """STUB [S4] — replace with the real routing agent + ETA engine in Phase 3."""
    sequenced: list[SequencedStop] = []
    per_leg_km, per_leg_min = 12.0, 25.0
    for i, stop in enumerate(inp.stops):
        sequenced.append(SequencedStop(
            sequence=i + 1,
            stop_id=stop.stop_id,
            eta=stop.window_start,  # placeholder ETA; real ETA engine in Phase 3
            distance_from_prev_km=0.0 if i == 0 else per_leg_km,
        ))
    n = len(sequenced)
    return RoutingOutput(
        workflow_id=inp.workflow_id,
        sequenced_stops=sequenced,
        total_distance_km=per_leg_km * max(n - 1, 0),
        total_duration_min=per_leg_min * n,
        notification_plan=[
            NotificationPlan(trigger="ON_THE_WAY", channel="PUSH", message="Your delivery is on the way."),
            NotificationPlan(trigger="TEN_MIN_OUT", channel="PUSH", message="Your driver is about 10 minutes away."),
            NotificationPlan(trigger="DELIVERED", channel="PUSH", message="Your package has been delivered."),
        ],
    )


def routing_node(state: WorkflowState) -> dict:
    inp = _build_input(state)
    out = _run(inp)
    return {
        # last planning step — hand over to the human approval gate
        "status": WorkflowStatus.AWAITING_APPROVAL.value,
        "routing": out.model_dump(),
        "audit": [AuditEntry(
            step="route", agent="routing",
            summary=f"Sequenced {len(out.sequenced_stops)} stop(s), "
                    f"{out.total_distance_km:.1f} km, {len(out.notification_plan)} notifications drafted.",
            tool_calls=["distance_matrix", "route_sequencer", "eta_calculator", "notification_composer"],
        ).model_dump()],
    }
