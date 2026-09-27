# [S4] Route Planning & Notification agent — last agent before the human gate.
#
# "Code drives, LLM narrates." `_run` orchestrates the four deterministic tools
# (sequence -> distances -> ETAs -> notifications) that MAKE every decision; the
# LLM (in `routing_node`, via app.llm) only writes the human-readable summary for
# the approval screen. A model failure can never produce a wrong route or ETA — and
# if the LLM is down, narration degrades to a template while the plan stays valid.
from __future__ import annotations

from datetime import datetime

from app import llm
from app.schemas.common import AuditEntry, BatchCandidate, WorkflowStatus
from app.schemas.routing import (
    NotificationPlan,
    RoutingInput,
    RoutingOutput,
    SequencedStop,
    Stop,
)
from app.state import WorkflowState
from app.tools.routing_tools import (
    eta_calculator,
    notification_composer,
    route_legs,
    route_sequencer,
)

# Minutes spent unloading/servicing each stop before departing to the next.
SERVICE_MIN = 5.0


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


def _run(inp: RoutingInput, *, start_time: str, fragile: bool = False) -> RoutingOutput:
    """Deterministically build the routing plan by orchestrating the four tools.

    1. route_sequencer  -> order the stops (nearest-neighbour, window-aware)
    2. route_legs       -> real leg distances/durations (OSRM, haversine fallback)
    3. eta_calculator   -> per-stop ETAs from those legs
    4. notification_composer -> the customer message set
    """
    stops = [s.model_dump() for s in inp.stops]

    ordered = route_sequencer(stops)                              # tool 1
    legs = route_legs(ordered)                                    # tool 2

    # Use the real (OSRM/haversine) leg distances so ETAs and distances agree.
    for i, stop in enumerate(ordered):
        stop["distance_from_prev_km"] = legs["leg_distances_km"][i]

    timed = eta_calculator(                                       # tool 3
        ordered, leg_durations_min=legs["leg_durations_min"],
        start_time=start_time, service_min=SERVICE_MIN,
    )

    sequenced = [
        SequencedStop(
            sequence=s["sequence"], stop_id=s["stop_id"],
            eta=s["eta"], distance_from_prev_km=s["distance_from_prev_km"],
        )
        for s in timed
    ]
    notifications = notification_composer(timed, fragile=fragile)  # tool 4

    return RoutingOutput(
        workflow_id=inp.workflow_id,
        sequenced_stops=sequenced,
        total_distance_km=round(sum(s.distance_from_prev_km for s in sequenced), 3),
        total_duration_min=timed[-1]["cumulative_min"] if timed else 0.0,
        notification_plan=[NotificationPlan(**n) for n in notifications],
    )


def routing_node(state: WorkflowState) -> dict:
    inp = _build_input(state)
    raw = state["input"]

    start_time = raw.get("delivery_window_start") or datetime.now().isoformat(timespec="seconds")
    fragile = "fragile" in ((state.get("triage") or {}).get("special_handling_flags") or [])

    out = _run(inp, start_time=start_time, fragile=fragile)

    # LLM narration for the approval screen (data-only customer notes; degrades to a
    # template if Ollama is unavailable).
    summary = llm.summarize_plan({
        "stops": [s.model_dump() for s in out.sequenced_stops],
        "total_distance_km": out.total_distance_km,
        "total_duration_min": out.total_duration_min,
        "notification_count": len(out.notification_plan),
        "customer_notes": raw.get("customer_notes", ""),
    })

    return {
        # last planning step — hand over to the human approval gate
        "status": WorkflowStatus.AWAITING_APPROVAL.value,
        "routing": out.model_dump(),
        "audit": [AuditEntry(
            step="route", agent="routing", summary=summary,
            tool_calls=["route_sequencer", "distance_matrix", "eta_calculator", "notification_composer"],
        ).model_dump()],
    }
