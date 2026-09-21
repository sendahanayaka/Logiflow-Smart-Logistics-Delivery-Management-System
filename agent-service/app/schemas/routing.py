# [S4] Route Planning & Notification — frozen JSON I/O contract.
# Last agent before the human approval gate. ETAs are computed by deterministic
# code (route sequencer + ETA calculator invoked as tools), not guessed by the LLM.
from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.common import BatchCandidate


class Stop(BaseModel):
    stop_id: str
    order_id: str
    address: str
    lat: float
    lng: float
    window_start: str
    window_end: str


class RoutingInput(BaseModel):
    workflow_id: str
    approved_batch: BatchCandidate
    driver_id: str
    vehicle_id: str
    stops: list[Stop] = Field(default_factory=list)


class SequencedStop(BaseModel):
    sequence: int
    stop_id: str
    eta: str
    distance_from_prev_km: float


class NotificationPlan(BaseModel):
    trigger: str   # ON_THE_WAY | TEN_MIN_OUT | DELIVERED
    channel: str   # PUSH | SMS | EMAIL
    message: str


class RoutingOutput(BaseModel):
    workflow_id: str
    sequenced_stops: list[SequencedStop] = Field(default_factory=list)
    total_distance_km: float = 0.0
    total_duration_min: float = 0.0
    notification_plan: list[NotificationPlan] = Field(default_factory=list)
