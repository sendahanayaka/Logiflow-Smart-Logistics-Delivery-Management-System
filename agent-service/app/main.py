# [S4] FastAPI entry for the internal agent service.
#
# INTERNAL ONLY: this service is invoked by the ASP.NET Core backend and is never
# reachable from the React or Flutter clients. An optional shared-secret header
# (AGENT_SERVICE_API_KEY) enforces that at the network edge.
#
#   POST /workflow/run                 -> run the graph up to the human gate
#   POST /workflow/{id}/approval       -> inject the decision, resume to completion
#   GET  /workflow/{id}                -> current persisted state snapshot
#   GET  /health
from __future__ import annotations

from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException
from langgraph.checkpoint.memory import MemorySaver
from pydantic import BaseModel

from app import config
from app.schemas.common import ApprovalDecision
from app.state import initial_state

app = FastAPI(title="LogiFlow Agent Service", version="0.1.0")

# One in-process checkpointer keeps paused workflows between /run and /approval.
# NOTE: durable state is owned by PostgreSQL via the backend; this is the runtime
# working copy. A DB-backed checkpointer can replace MemorySaver later.
_checkpointer = MemorySaver()
graph = None  # built lazily so importing app.main never requires a running LLM


def _get_graph():
    global graph
    if graph is None:
        from app.graph import build_graph

        graph = build_graph(checkpointer=_checkpointer)
    return graph


def require_internal_key(x_internal_api_key: str | None = Header(default=None)) -> None:
    """Reject callers that are not the backend, when a key is configured."""
    if config.AGENT_SERVICE_API_KEY and x_internal_api_key != config.AGENT_SERVICE_API_KEY:
        raise HTTPException(status_code=401, detail="internal service: invalid or missing key")


def _config_for(workflow_id: str) -> dict:
    return {"configurable": {"thread_id": workflow_id}}


class RunRequest(BaseModel):
    payload: dict[str, Any]


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model": config.OLLAMA_MODEL}


@app.post("/workflow/run", dependencies=[Depends(require_internal_key)])
def run_workflow(req: RunRequest) -> dict:
    state = initial_state(req.payload)
    cfg = _config_for(state["workflow_id"])
    result = _get_graph().invoke(state, cfg)  # stops at the human-approval interrupt
    return {
        "workflow_id": result["workflow_id"],
        "status": result.get("status"),
        "proposal": {
            "triage": result.get("triage"),
            "allocation": result.get("allocation"),
            "validation": result.get("validation"),
            "routing": result.get("routing"),
        },
        "audit": result.get("audit", []),
        "errors": result.get("errors", []),
    }


@app.post("/workflow/{workflow_id}/approval", dependencies=[Depends(require_internal_key)])
def approve_workflow(workflow_id: str, decision: ApprovalDecision) -> dict:
    cfg = _config_for(workflow_id)
    g = _get_graph()
    snapshot = g.get_state(cfg)
    if not snapshot.values:
        raise HTTPException(status_code=404, detail="unknown workflow_id")
    g.update_state(cfg, {"approval": decision.model_dump()})
    result = g.invoke(None, cfg)  # resume from the interrupt
    return {
        "workflow_id": workflow_id,
        "status": result.get("status"),
        "outcome": result.get("outcome"),
        "audit": result.get("audit", []),
    }


@app.get("/workflow/{workflow_id}", dependencies=[Depends(require_internal_key)])
def get_workflow(workflow_id: str) -> dict:
    snapshot = _get_graph().get_state(_config_for(workflow_id))
    if not snapshot.values:
        raise HTTPException(status_code=404, detail="unknown workflow_id")
    return snapshot.values
