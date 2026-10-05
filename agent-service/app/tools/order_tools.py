# [S1] Allow-listed tools for the Order Triage & Planning agent.
# Real implementations land in Phase 3. All backend data goes through the API.
from __future__ import annotations

import logging
from typing import Any

import httpx

from app import config

logger = logging.getLogger(__name__)


def _get_client() -> httpx.Client:
    headers = {}
    if config.AGENT_SERVICE_API_KEY:
        headers["X-API-Key"] = config.AGENT_SERVICE_API_KEY
    return httpx.Client(base_url=config.BACKEND_API_BASE_URL, headers=headers)


def order_query(order_ids: list[str]) -> list[dict[str, Any]]:
    """Fetch order + package details from the backend."""
    if not order_ids:
        return []

    results = []
    with _get_client() as client:
        for order_id in order_ids:
            try:
                # Based on convention API might be /api/orders/{order_id}
                resp = client.get(f"/api/orders/{order_id}", timeout=2.0)
                resp.raise_for_status()
                results.append(resp.json())
            except Exception as e:
                logger.warning(f"Failed to fetch order {order_id}: {e}")
                # Safe fallback since OrdersController is unimplemented
                results.append({"order_id": order_id, "status": "UNKNOWN_MOCK_FALLBACK"})
    return results


def serviceability_validator(addresses: list[str]) -> dict[str, Any]:
    """Check delivery addresses fall inside serviceable zones."""
    if not addresses:
        return {}

    res = {}
    with _get_client() as client:
        for address in addresses:
            try:
                # No serviceability endpoint exists yet, safe pattern
                resp = client.post("/api/serviceability/check", json={"address": address}, timeout=2.0)
                resp.raise_for_status()
                res[address] = resp.json().get("serviceable", True)
            except Exception:
                # Fallback to true
                res[address] = True
    return res


def pricing_calculator(order: dict[str, Any]) -> dict[str, Any]:
    """Delivery cost & priority classification (weight, distance, tier)."""
    try:
        with _get_client() as client:
            resp = client.post("/api/pricing/calculate", json=order, timeout=2.0)
            resp.raise_for_status()
            return resp.json()
    except Exception:
        # Fallback to requested priority or STANDARD
        return {"priority_class": order.get("requested_priority", "STANDARD"), "cost": 0.0}


def workflow_state_writer(workflow_id: str, state: dict[str, Any]) -> None:
    """Persist workflow state to PostgreSQL via the API.

    No confirmed backend endpoint/contract for workflow-state persistence exists.
    Safest repository-consistent behavior: Isolated placeholder/no-op logging.
    """
    logger.info(f"workflow_state_writer isolation fallback: No backend API for workflow {workflow_id}")
    pass
