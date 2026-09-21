# [S1] Allow-listed tools for the Order Triage & Planning agent.
# Real implementations land in Phase 3. All backend data goes through the API.
from __future__ import annotations

from typing import Any


def order_query(order_ids: list[str]) -> list[dict[str, Any]]:
    """Fetch order + package details from the backend."""
    raise NotImplementedError("Phase 3 [S1]: call backend order query endpoint")


def serviceability_validator(addresses: list[str]) -> dict[str, Any]:
    """Check delivery addresses fall inside serviceable zones."""
    raise NotImplementedError("Phase 3 [S1]: implement serviceability check")


def pricing_calculator(order: dict[str, Any]) -> dict[str, Any]:
    """Delivery cost & priority classification (weight, distance, tier)."""
    raise NotImplementedError("Phase 3 [S1]: implement pricing engine call")


def workflow_state_writer(workflow_id: str, state: dict[str, Any]) -> None:
    """Persist workflow state to PostgreSQL via the API."""
    raise NotImplementedError("Phase 3 [S1]: call backend workflow-state writer")
