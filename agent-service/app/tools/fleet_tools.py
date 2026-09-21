# [S2] Allow-listed tools for the Resource Allocation agent.
# Real implementations land in Phase 3. Compliance runs BEFORE the LLM ranks.
from __future__ import annotations

from typing import Any


def fleet_availability(window_start: str, window_end: str) -> list[dict[str, Any]]:
    """Vehicles free in the delivery window."""
    raise NotImplementedError("Phase 3 [S2]: call backend fleet-availability endpoint")


def driver_workload(driver_ids: list[str]) -> dict[str, Any]:
    """Current logged hours per driver."""
    raise NotImplementedError("Phase 3 [S2]: call backend driver-workload endpoint")


def compliance_checker(driver_id: str, proposed_hours: float) -> dict[str, Any]:
    """Driver-hours compliance engine — excludes non-compliant drivers up front."""
    raise NotImplementedError("Phase 3 [S2]: implement compliance engine call")


def capacity_lookup(vehicle_id: str) -> dict[str, Any]:
    """Weight/volume capacity for a vehicle."""
    raise NotImplementedError("Phase 3 [S2]: call backend capacity lookup")
