# [ALL] Shared enums and cross-agent value objects.
# Frozen contract — change only via PR (two reviewers).
from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class WorkflowStatus(str, Enum):
    """Lifecycle of one agentic workflow (persisted to PostgreSQL via the API)."""

    PENDING = "PENDING"
    PLANNING = "PLANNING"            # S1 triage
    ALLOCATING = "ALLOCATING"        # S2 allocation
    VALIDATING = "VALIDATING"        # S3 validation
    ROUTING = "ROUTING"              # S4 routing
    AWAITING_APPROVAL = "AWAITING_APPROVAL"  # human gate
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXECUTING = "EXECUTING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"                # safe-failure: flagged for manual handling


class ApprovalAction(str, Enum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    REVISE = "REVISE"


class ApprovalDecision(BaseModel):
    """The human operations-manager decision at the approval gate."""

    action: ApprovalAction
    decided_by: str
    reason: str | None = None
    revisions: dict[str, Any] | None = None


class AuditEntry(BaseModel):
    """One observability record — what an agent did, which tools it called."""

    step: str
    agent: str
    summary: str
    tool_calls: list[str] = Field(default_factory=list)
    duration_ms: int | None = None
    ok: bool = True


class AgentError(BaseModel):
    """Recorded on the safe-failure path; nothing is ever silently lost."""

    step: str
    message: str
    recoverable: bool = False


class BatchCandidate(BaseModel):
    """A set of orders proposed to travel together on one vehicle."""

    order_ids: list[str]
    vehicle_id: str
