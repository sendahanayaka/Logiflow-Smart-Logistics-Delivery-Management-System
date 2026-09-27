# [S4] Phase 4 tests — real routing agent (_run orchestration) + LLM narration.
# Hermetic: OSRM is forced offline (-> haversine) and the LLM is patched, so CI
# needs neither network nor Ollama. Determinism comes from the fallbacks.
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app import llm
from app.agents import routing_agent
from app.agents.routing_agent import _run, routing_node
from app.schemas.routing import RoutingInput, RoutingOutput
from app.schemas.common import BatchCandidate, WorkflowStatus
from app.state import initial_state
from app.tools import routing_tools
from app.tools.routing_tools import notification_composer

GOLDEN = json.loads((Path(__file__).parent / "golden_cases" / "kasun_case.json").read_text())


@pytest.fixture
def offline(monkeypatch):
    """Force OSRM offline (haversine) and stub the LLM to a fixed summary."""
    def boom(*a, **k):
        raise RuntimeError("offline")
    monkeypatch.setattr(routing_tools.httpx, "get", boom)
    monkeypatch.setattr(llm, "summarize_plan", lambda ctx: "TEST SUMMARY")


def _routing_input() -> RoutingInput:
    return RoutingInput(
        workflow_id=GOLDEN["workflow_id"],
        approved_batch=BatchCandidate(order_ids=GOLDEN["order_ids"], vehicle_id="veh-1"),
        driver_id="drv-1", vehicle_id="veh-1",
        stops=GOLDEN["stops"],
    )


# --- _run: deterministic orchestration --------------------------------------
def test_run_produces_schema_valid_output(offline):
    out = _run(_routing_input(), start_time=GOLDEN["delivery_window_start"], fragile=True)
    assert isinstance(out, RoutingOutput)
    assert len(out.sequenced_stops) == len(GOLDEN["stops"]) == 2
    assert [s.sequence for s in out.sequenced_stops] == [1, 2]


def test_run_etas_are_ordered_and_stamped(offline):
    out = _run(_routing_input(), start_time=GOLDEN["delivery_window_start"])
    etas = [s.eta for s in out.sequenced_stops]
    assert all(etas)                 # every stop has an ETA
    assert etas == sorted(etas)      # non-decreasing along the route


def test_run_totals_are_consistent(offline):
    out = _run(_routing_input(), start_time=GOLDEN["delivery_window_start"])
    assert out.total_distance_km == round(
        sum(s.distance_from_prev_km for s in out.sequenced_stops), 3
    )
    assert out.total_duration_min > 0


def test_run_notifications_reflect_fragile(offline):
    out = _run(_routing_input(), start_time=GOLDEN["delivery_window_start"], fragile=True)
    on_the_way = next(n for n in out.notification_plan if n.trigger == "ON_THE_WAY")
    assert "fragile" in on_the_way.message.lower()
    assert len(out.notification_plan) == 3


# --- routing_node: state + audit + gate -------------------------------------
def test_routing_node_pauses_at_gate_with_llm_summary(offline):
    state = initial_state(GOLDEN)
    # minimal upstream context so _build_input has what it needs
    state["triage"] = {"validated_order_ids": GOLDEN["order_ids"], "special_handling_flags": ["fragile"]}
    result = routing_node(state)

    assert result["status"] == WorkflowStatus.AWAITING_APPROVAL.value
    RoutingOutput(**result["routing"])                     # schema-valid
    assert result["audit"][0]["summary"] == "TEST SUMMARY"
    assert result["audit"][0]["tool_calls"] == [
        "route_sequencer", "distance_matrix", "eta_calculator", "notification_composer",
    ]


# --- notification_composer tool ---------------------------------------------
def test_notification_composer_default_and_fragile():
    plain = notification_composer([])
    assert [n["trigger"] for n in plain] == ["ON_THE_WAY", "TEN_MIN_OUT", "DELIVERED"]
    assert "fragile" not in plain[0]["message"].lower()

    frag = notification_composer([], fragile=True)
    assert "fragile" in frag[0]["message"].lower()


# --- llm wrapper: graceful fallback + success -------------------------------
def test_summarize_plan_falls_back_when_llm_unavailable(monkeypatch):
    def boom():
        raise RuntimeError("ollama down")
    monkeypatch.setattr(llm, "_get_chat", boom)
    text = llm.summarize_plan({"stops": [1, 2], "total_distance_km": 5.0,
                               "total_duration_min": 30, "notification_count": 3})
    assert "Awaiting operations-manager approval" in text   # deterministic template


def test_summarize_plan_uses_llm_text_when_available(monkeypatch):
    class _Fake:
        def invoke(self, messages):
            return type("R", (), {"content": "Two Kandy stops, both on time."})()
    monkeypatch.setattr(llm, "_get_chat", lambda: _Fake())
    assert llm.summarize_plan({"stops": []}) == "Two Kandy stops, both on time."


def test_summarize_plan_empty_llm_text_falls_back(monkeypatch):
    class _Fake:
        def invoke(self, messages):
            return type("R", (), {"content": "   "})()
    monkeypatch.setattr(llm, "_get_chat", lambda: _Fake())
    assert "Awaiting" in llm.summarize_plan({"stops": [], "total_distance_km": 0,
                                             "total_duration_min": 0, "notification_count": 0})
