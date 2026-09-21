# [S2] Resource Allocation — frozen JSON I/O contract.
# Compliance engine runs BEFORE the LLM ranks: the LLM only chooses among a
# pre-filtered legal set. A model hallucination can never propose an illegal pairing.
from __future__ import annotations

from pydantic import BaseModel, Field


class AllocationInput(BaseModel):
    workflow_id: str
    plan_step: str
    total_weight_kg: float
    total_volume_m3: float
    vehicle_type: str | None = None
    delivery_window_start: str
    delivery_window_end: str


class AllocationCandidate(BaseModel):
    driver_id: str
    vehicle_id: str
    reasons: list[str] = Field(default_factory=list)
    constraints_checked: list[str] = Field(default_factory=list)


class AllocationOutput(BaseModel):
    workflow_id: str
    proposed: AllocationCandidate
    alternatives: list[AllocationCandidate] = Field(default_factory=list)
    compliance_passed: bool = True
