# [ALL] LangGraph wiring of the four agents + human approval gate + safe-failure.
# Frozen contract — change only via PR (two reviewers).
#
#   START -> triage(S1) -> allocate(S2) -> validate(S3) -> route(S4)
#            -> [interrupt] HUMAN APPROVAL -> execute -> END
#   any node raises ------------------------------------> safe_failure -> END
#
# Every node is wrapped by `safe_node`: if it raises, the workflow is flagged for
# manual handling (safe failure) instead of crashing or silently losing the order.
from __future__ import annotations

import functools
import time
from typing import Callable

from langgraph.graph import END, START, StateGraph

from app.agents import allocation_node, routing_node, triage_node, validation_node
from app.schemas.common import AgentError, ApprovalAction, AuditEntry, WorkflowStatus
from app.state import WorkflowState

Node = Callable[[WorkflowState], dict]


def safe_node(step: str, fn: Node) -> Node:
    """Wrap a node so any exception routes to the safe-failure branch."""

    @functools.wraps(fn)
    def wrapper(state: WorkflowState) -> dict:
        start = time.perf_counter()
        try:
            return fn(state)
        except Exception as exc:  # noqa: BLE001 — safe failure must catch everything
            duration = int((time.perf_counter() - start) * 1000)
            return {
                "status": WorkflowStatus.FAILED.value,
                "errors": [AgentError(step=step, message=str(exc)).model_dump()],
                "audit": [AuditEntry(
                    step=step, agent=step, summary=f"{step} failed: {exc}",
                    duration_ms=duration, ok=False,
                ).model_dump()],
            }

    return wrapper


def _continue_or_fail(next_step: str) -> Callable[[WorkflowState], str]:
    """Conditional edge: proceed unless a node flagged a safe failure."""

    def router(state: WorkflowState) -> str:
        if state.get("status") == WorkflowStatus.FAILED.value:
            return "safe_failure"
        return next_step

    return router


def _after_validation(state: WorkflowState) -> str:
    """Route only a deterministic S3 PASS to S4; FAIL/REVISE stop safely."""
    validation = state.get("validation") or {}
    if (
        state.get("status") == WorkflowStatus.FAILED.value
        or validation.get("result") != "PASS"
    ):
        return "safe_failure"
    return "route"


def human_approval_node(state: WorkflowState) -> dict:
    """Runs only after a human decision has been injected into state['approval']."""
    decision = state.get("approval") or {}
    action = decision.get("action")
    if action == ApprovalAction.APPROVE.value:
        return {
            "status": WorkflowStatus.APPROVED.value,
            "audit": [AuditEntry(
                step="human_approval", agent="human",
                summary=f"Approved by {decision.get('decided_by', 'operations-manager')}.",
            ).model_dump()],
        }
    return {
        "status": WorkflowStatus.REJECTED.value,
        "outcome": f"Not approved (decision={action or 'none'}).",
        "audit": [AuditEntry(
            step="human_approval", agent="human",
            summary=f"Decision: {action or 'none'}.", ok=action is not None,
        ).model_dump()],
    }


def _after_approval(state: WorkflowState) -> str:
    if state.get("status") == WorkflowStatus.APPROVED.value:
        return "execute"
    return END


def execute_node(state: WorkflowState) -> dict:
    return {
        "status": WorkflowStatus.COMPLETED.value,
        "outcome": "Approved run dispatched; live tracking active.",
        "audit": [AuditEntry(
            step="execute", agent="system",
            summary="Dispatched approved plan to the driver.",
        ).model_dump()],
    }


def safe_failure_node(state: WorkflowState) -> dict:
    return {
        "outcome": state.get("outcome")
        or "Planning could not complete — order flagged for manual handling.",
        "audit": [AuditEntry(
            step="safe_failure", agent="system",
            summary="Flagged for manual handling; nothing lost.", ok=False,
        ).model_dump()],
    }


def build_graph(checkpointer=None):
    """Compile the workflow. A checkpointer is required to pause at the human gate."""
    g = StateGraph(WorkflowState)

    # Node ids must not collide with state keys (triage/allocation/validation/
    # routing), so the workflow steps use the verbs from the architecture diagram:
    # plan -> allocate -> validate -> route.
    g.add_node("plan", safe_node("plan", triage_node))
    g.add_node("allocate", safe_node("allocate", allocation_node))
    g.add_node("validate", safe_node("validate", validation_node))
    g.add_node("route", safe_node("route", routing_node))
    g.add_node("human_approval", human_approval_node)
    g.add_node("execute", execute_node)
    g.add_node("safe_failure", safe_failure_node)

    g.add_edge(START, "plan")
    g.add_conditional_edges("plan", _continue_or_fail("allocate"),
                            {"allocate": "allocate", "safe_failure": "safe_failure"})
    g.add_conditional_edges("allocate", _continue_or_fail("validate"),
                            {"validate": "validate", "safe_failure": "safe_failure"})
    g.add_conditional_edges("validate", _after_validation,
                            {"route": "route", "safe_failure": "safe_failure"})
    g.add_conditional_edges("route", _continue_or_fail("human_approval"),
                            {"human_approval": "human_approval", "safe_failure": "safe_failure"})
    g.add_conditional_edges("human_approval", _after_approval,
                            {"execute": "execute", END: END})
    g.add_edge("execute", END)
    g.add_edge("safe_failure", END)

    # interrupt_before pauses the graph before the human gate runs, so an external
    # actor (the ASP.NET Core API / React approval screen) supplies the decision.
    return g.compile(checkpointer=checkpointer, interrupt_before=["human_approval"])
