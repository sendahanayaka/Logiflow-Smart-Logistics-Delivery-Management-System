# [ALL] Shared workflow state schema for the LangGraph graph.
# Frozen contract — change only via PR (two reviewers). Every node receives this
# state and returns a partial update. `audit` and `errors` accumulate (reducer).
from __future__ import annotations

import operator
from typing import Annotated, Any, TypedDict
from uuid import uuid4

from app.schemas.common import WorkflowStatus


class WorkflowState(TypedDict, total=False):
    # identity / objective
    workflow_id: str
    objective: str
    input: dict[str, Any]          # original request payload (order text = DATA)

    # lifecycle
    status: str                    # a WorkflowStatus value

    # per-agent structured outputs (stored as dicts so the checkpointer can serialize)
    triage: dict[str, Any] | None
    allocation: dict[str, Any] | None
    validation: dict[str, Any] | None
    routing: dict[str, Any] | None

    # human gate + result
    approval: dict[str, Any] | None
    outcome: str | None

    # observability (accumulated across steps)
    audit: Annotated[list[dict[str, Any]], operator.add]
    errors: Annotated[list[dict[str, Any]], operator.add]


def initial_state(payload: dict[str, Any]) -> WorkflowState:
    """Build the starting state from an incoming request payload."""
    return {
        "workflow_id": payload.get("workflow_id") or f"wf-{uuid4().hex[:12]}",
        "objective": payload.get("objective", ""),
        "input": payload,
        "status": WorkflowStatus.PENDING.value,
        "triage": None,
        "allocation": None,
        "validation": None,
        "routing": None,
        "approval": None,
        "outcome": None,
        "audit": [],
        "errors": [],
    }
