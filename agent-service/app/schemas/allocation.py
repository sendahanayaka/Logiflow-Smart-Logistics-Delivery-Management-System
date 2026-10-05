# [S2] Resource Allocation — frozen JSON I/O contract.
# Compliance engine runs BEFORE the LLM ranks: the LLM only chooses among a
# pre-filtered legal set. A model hallucination can never propose an illegal pairing.
from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class AllocationInput(BaseModel):
    workflow_id: str
    plan_step: str
    total_weight_kg: float
    total_volume_m3: float
    vehicle_type: str | None = None
    # When the dispatch batch is already committed to a vehicle, allocation is
    # constrained to it (S3 validation requires allocation.vehicle == batch.vehicle).
    vehicle_id: str | None = None
    delivery_window_start: str
    delivery_window_end: str
    order_ids: list[str] = Field(default_factory=list)
    orders: list[dict[str, Any]] = Field(default_factory=list)


class AllocationCandidate(BaseModel):
    driver_id: str
    vehicle_id: str
    order_ids: list[str] = Field(default_factory=list)
    compatible_order_ids: list[str] = Field(default_factory=list)
    incompatible_order_ids: list[str] = Field(default_factory=list)
    total_weight_kg: float = 0.0
    total_volume_m3: float = 0.0
    capacity_utilization_percent: float = 0.0
    reasons: list[str] = Field(default_factory=list)
    constraints_checked: list[str] = Field(default_factory=list)


class LLMAllocationChoice(BaseModel):
    selected_driver_id: str
    selected_vehicle_id: str
    reason: str = Field(default="")


class AllocationOutput(BaseModel):
    workflow_id: str
    proposed: AllocationCandidate
    alternatives: list[AllocationCandidate] = Field(default_factory=list)
    compliance_passed: bool = True
