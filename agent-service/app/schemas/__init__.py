# [ALL] Pydantic I/O contracts for the four agents (one file per agent).
from app.schemas.common import (
    AgentError,
    ApprovalAction,
    ApprovalDecision,
    AuditEntry,
    BatchCandidate,
    WorkflowStatus,
)
from app.schemas.triage import PackageDetail, PlanStep, TriageInput, TriageOutput
from app.schemas.allocation import (
    AllocationCandidate,
    AllocationInput,
    AllocationOutput,
)
from app.schemas.validation import RuleResult, ValidationInput, ValidationOutput
from app.schemas.routing import (
    NotificationPlan,
    RoutingInput,
    RoutingOutput,
    SequencedStop,
    Stop,
)

__all__ = [
    "AgentError",
    "ApprovalAction",
    "ApprovalDecision",
    "AuditEntry",
    "BatchCandidate",
    "WorkflowStatus",
    "PackageDetail",
    "PlanStep",
    "TriageInput",
    "TriageOutput",
    "AllocationCandidate",
    "AllocationInput",
    "AllocationOutput",
    "RuleResult",
    "ValidationInput",
    "ValidationOutput",
    "NotificationPlan",
    "RoutingInput",
    "RoutingOutput",
    "SequencedStop",
    "Stop",
]
