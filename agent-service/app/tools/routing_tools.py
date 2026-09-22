# [S4] Allow-listed tools for the Route Planning & Notification agent.
#
# Tools are the ONLY way an agent affects the world. Every tool must validate its
# input, return structured output, and (for backend data) go through the API — never
# touch the database directly. Real implementations land in Phase 3.
from __future__ import annotations

import math
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


def eta_calculator(sequenced_stops: list[dict], leg_durations: list[float]) -> list[dict]:
    """Per-stop ETAs; recomputed on delay events (the non-CRUD ETA engine)."""
    raise NotImplementedError("Phase 3 [S4]: implement ETA computation")


def notification_composer(stops: list[dict]) -> list[dict]:
    """Draft 'on the way' / '10 min out' / 'delivered' messages per stop."""
    raise NotImplementedError("Phase 3 [S4]: implement notification composer")
