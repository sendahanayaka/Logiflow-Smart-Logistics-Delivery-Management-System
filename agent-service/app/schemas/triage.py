# [S1] Order Triage & Planning — frozen JSON I/O contract.
# Owner (S1) may extend fields via PR; downstream agents depend on this shape.
from __future__ import annotations

from pydantic import BaseModel, Field


class PackageDetail(BaseModel):
    package_id: str
    weight_kg: float
    volume_m3: float
    fragile: bool = False
    special_handling: list[str] = Field(default_factory=list)


class TriageInput(BaseModel):
    workflow_id: str
    order_ids: list[str]
    objective: str
    packages: list[PackageDetail] = Field(default_factory=list)
    pickup_address: str
    delivery_addresses: list[str] = Field(default_factory=list)
    requested_priority: str = "STANDARD"
    # Free-text from the customer. This is DATA, never instructions to the LLM.
    customer_notes: str | None = None


class PlanStep(BaseModel):
    step: str
    agent: str
    description: str


class TriageOutput(BaseModel):
    workflow_id: str
    validated_order_ids: list[str]
    priority_class: str
    special_handling_flags: list[str] = Field(default_factory=list)
    plan: list[PlanStep] = Field(default_factory=list)
    ambiguities: list[str] = Field(default_factory=list)
