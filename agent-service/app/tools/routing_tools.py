# [S4] Allow-listed tools for the Route Planning & Notification agent.
#
# Tools are the ONLY way an agent affects the world. Every tool must validate its
# input, return structured output, and (for backend data) go through the API — never
# touch the database directly. Real implementations land in Phase 3.
from __future__ import annotations

import math
from datetime import datetime, timedelta
from typing import Any

EARTH_RADIUS_KM = 6371.0


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle (straight-line) distance in km between two lat/lng points.

    Used to ORDER stops in the sequencer. Real road distance/duration for ETAs
    comes from `distance_matrix` (Phase 3, OSRM) — with this same haversine as the
    offline fallback, so the workflow never breaks when OSRM is unreachable.
    """
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def distance_matrix(origins: list[dict], destinations: list[dict]) -> dict[str, Any]:
    """Distances/durations between stops. Backed by the API's MapsGateway (OSRM/OSM)."""
    raise NotImplementedError("Phase 3 [S4]: call backend distance-matrix endpoint")


def route_sequencer(stops: list[dict], start: dict | None = None) -> list[dict]:
    """Order stops for a single delivery run with a nearest-neighbour heuristic.

    Greedy nearest-neighbour by straight-line (haversine) distance: from the
    current position, always move to the closest un-visited stop. Delivery windows
    are honoured two ways — (1) with no depot given, the run is anchored on the most
    urgent stop (earliest ``window_end``); (2) exact-distance ties are broken toward
    the earlier deadline. Full window *feasibility* (can the driver actually arrive
    in time) is enforced later by the ETA calculator (Phase 2) and re-validated
    server-side before the approval gate — the sequencer only proposes an order.

    Args:
        stops: dicts each with at least ``stop_id``, ``lat``, ``lng``; optional
            ``window_end`` (ISO string) is used for the urgency tie-break.
        start: optional depot/origin ``{"lat": ..., "lng": ...}`` to begin from;
            when omitted, the most urgent stop becomes stop #1.

    Returns:
        Ordered copies of the input stops, each with ``sequence`` (1-based) and
        ``distance_from_prev_km`` (0.0 for the first stop). All original keys kept.
    """
    if not stops:
        return []

    remaining = [dict(s) for s in stops]
    ordered: list[dict] = []

    if start is not None:
        cur_lat, cur_lng = start["lat"], start["lng"]
    else:
        # No depot: begin at the most urgent stop so the earliest deadline is served.
        remaining.sort(key=lambda s: s.get("window_end") or "")
        first = remaining.pop(0)
        ordered.append({**first, "sequence": 1, "distance_from_prev_km": 0.0})
        cur_lat, cur_lng = first["lat"], first["lng"]

    while remaining:
        nxt = min(
            remaining,
            key=lambda s: (
                _haversine_km(cur_lat, cur_lng, s["lat"], s["lng"]),
                s.get("window_end") or "",
            ),
        )
        remaining.remove(nxt)
        leg_km = _haversine_km(cur_lat, cur_lng, nxt["lat"], nxt["lng"])
        ordered.append(
            {**nxt, "sequence": len(ordered) + 1, "distance_from_prev_km": round(leg_km, 3)}
        )
        cur_lat, cur_lng = nxt["lat"], nxt["lng"]

    return ordered


def eta_calculator(
    sequenced_stops: list[dict],
    leg_durations_min: list[float],
    start_time: str,
    service_min: float = 0.0,
) -> list[dict]:
    """Stamp a per-stop ETA onto an ordered run — the ETA computation engine.

        ETA(stop_i) = start_time + Σ leg_durations[0..i] + i * service_min

    i.e. cumulative travel time to reach stop *i*, plus the unload/service time
    already spent at each earlier stop. Because it's a pure function of its inputs,
    the same call doubles as the **tracking-timeline recompute**: on a delay event,
    call it again with a later ``start_time`` (or the actual current time + the
    remaining legs) to shift the downstream ETAs — there is no stored state to
    mutate. This "recompute on delay events" behaviour is what makes it a business
    engine rather than a stored field.

    Args:
        sequenced_stops: ordered stops from :func:`route_sequencer`; an optional
            ``window_end`` (ISO-8601) enables the on-time feasibility flag.
        leg_durations_min: minutes for each leg; ``leg[i]`` is the travel time to
            reach stop *i* (``leg[0]`` = origin/depot -> stop 0). Must have the same
            length as ``sequenced_stops``.
        start_time: ISO-8601 departure time from the origin.
        service_min: minutes spent servicing (unloading) each stop before departing.

    Returns:
        Copies of the stops, each with ``eta`` (ISO-8601), ``cumulative_min``, and
        ``on_time`` (``bool`` when ``window_end`` is present, else ``None``).

    Raises:
        ValueError: if the leg-duration count doesn't match the stop count.
    """
    if len(leg_durations_min) != len(sequenced_stops):
        raise ValueError(
            f"leg_durations_min has {len(leg_durations_min)} entries but there are "
            f"{len(sequenced_stops)} stop(s)"
        )

    origin = datetime.fromisoformat(start_time)
    out: list[dict] = []
    cumulative = 0.0
    for i, stop in enumerate(sequenced_stops):
        cumulative += leg_durations_min[i] + (service_min if i > 0 else 0.0)
        eta_dt = origin + timedelta(minutes=cumulative)
        window_end = stop.get("window_end")
        on_time = None if not window_end else eta_dt <= datetime.fromisoformat(window_end)
        out.append({
            **stop,
            "eta": eta_dt.isoformat(),
            "cumulative_min": round(cumulative, 2),
            "on_time": on_time,
        })
    return out


def notification_composer(stops: list[dict]) -> list[dict]:
    """Draft 'on the way' / '10 min out' / 'delivered' messages per stop."""
    raise NotImplementedError("Phase 3 [S4]: implement notification composer")
