# [S3] Allow-listed tools for the Load & Dispatch Validation agent.
# Real implementations land in Phase 3. Rules decide PASS/FAIL/REVISE, not the LLM.
from __future__ import annotations

from typing import Any


def capacity_calculator(package_ids: list[str], vehicle_id: str) -> dict[str, Any]:
    """Total weight/volume vs vehicle capacity."""
    raise NotImplementedError("Phase 3 [S3]: implement capacity calculation")


def compatibility_rules(package_ids: list[str]) -> dict[str, Any]:
    """Package-compatibility rules (e.g. fragile not stacked under heavy)."""
    raise NotImplementedError("Phase 3 [S3]: implement compatibility rules engine")


def warehouse_stock_query(package_ids: list[str], warehouse_id: str) -> dict[str, Any]:
    """Confirm the packages are physically present at the warehouse."""
    raise NotImplementedError("Phase 3 [S3]: call backend stock query")


def schema_validator(payload: dict[str, Any], schema_name: str) -> bool:
    """Re-validate a proposal against its JSON schema before it advances."""
    raise NotImplementedError("Phase 3 [S3]: implement schema validation tool")
