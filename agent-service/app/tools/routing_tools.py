# [S4] Allow-listed tools for the Route Planning & Notification agent.
#
# Tools are the ONLY way an agent affects the world. Every tool must validate its
# input, return structured output, and (for backend data) go through the API — never
# touch the database directly. Real implementations land in Phase 3.
from __future__ import annotations

from typing import Any


def distance_matrix(origins: list[dict], destinations: list[dict]) -> dict[str, Any]:
    """Distances/durations between stops. Backed by the API's MapsGateway (OSRM/OSM)."""
    raise NotImplementedError("Phase 3 [S4]: call backend distance-matrix endpoint")


def route_sequencer(stops: list[dict]) -> list[dict]:
    """Heuristic ordering of stops (e.g. nearest-neighbour) within delivery windows."""
    raise NotImplementedError("Phase 3 [S4]: implement route sequencing heuristic")


def eta_calculator(sequenced_stops: list[dict], leg_durations: list[float]) -> list[dict]:
    """Per-stop ETAs; recomputed on delay events (the non-CRUD ETA engine)."""
    raise NotImplementedError("Phase 3 [S4]: implement ETA computation")


def notification_composer(stops: list[dict]) -> list[dict]:
    """Draft 'on the way' / '10 min out' / 'delivered' messages per stop."""
    raise NotImplementedError("Phase 3 [S4]: implement notification composer")
