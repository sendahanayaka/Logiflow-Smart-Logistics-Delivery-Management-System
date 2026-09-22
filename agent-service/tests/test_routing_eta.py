# [S4] Phase 2 tests — ETA computation engine.
# Pure time math: no Ollama, no network. Keeps agent-ci green.
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.tools.routing_tools import eta_calculator, route_sequencer

GOLDEN = json.loads((Path(__file__).parent / "golden_cases" / "kasun_case.json").read_text())

START = "2026-09-22T09:00:00"


# --- core cumulative maths ---------------------------------------------------
def test_eta_basic_cumulative_no_service():
    stops = [{"stop_id": "a"}, {"stop_id": "b"}]
    out = eta_calculator(stops, leg_durations_min=[30, 25], start_time=START)
    assert out[0]["eta"] == "2026-09-22T09:30:00"
    assert out[1]["eta"] == "2026-09-22T09:55:00"
    assert out[0]["cumulative_min"] == 30
    assert out[1]["cumulative_min"] == 55


def test_eta_service_time_is_added_between_stops():
    stops = [{"stop_id": "a"}, {"stop_id": "b"}]
    # service (10m) is spent at stop a before driving the 25m leg to stop b.
    out = eta_calculator(stops, leg_durations_min=[30, 25], start_time=START, service_min=10)
    assert out[0]["eta"] == "2026-09-22T09:30:00"       # no service before the first stop
    assert out[1]["eta"] == "2026-09-22T10:05:00"       # 30 + 25 + 10
    assert out[1]["cumulative_min"] == 65


def test_eta_empty_run():
    assert eta_calculator([], leg_durations_min=[], start_time=START) == []


# --- input validation --------------------------------------------------------
def test_eta_leg_count_mismatch_raises():
    with pytest.raises(ValueError):
        eta_calculator([{"stop_id": "a"}], leg_durations_min=[30, 25], start_time=START)


# --- window feasibility flag -------------------------------------------------
def test_eta_on_time_true_and_false():
    stops = [
        {"stop_id": "a", "window_end": "2026-09-22T10:00:00"},   # eta 09:30 -> on time
        {"stop_id": "b", "window_end": "2026-09-22T09:50:00"},   # eta 09:55 -> late
    ]
    out = eta_calculator(stops, leg_durations_min=[30, 25], start_time=START)
    assert out[0]["on_time"] is True
    assert out[1]["on_time"] is False


def test_eta_on_time_none_without_window():
    out = eta_calculator([{"stop_id": "a"}], leg_durations_min=[30], start_time=START)
    assert out[0]["on_time"] is None


# --- the timeline recompute (delay event) ------------------------------------
def test_eta_recompute_shifts_downstream_on_late_start():
    stops = [{"stop_id": "a"}, {"stop_id": "b"}]
    legs = [30, 25]
    on_time = eta_calculator(stops, legs, start_time="2026-09-22T09:00:00")
    delayed = eta_calculator(stops, legs, start_time="2026-09-22T09:15:00")  # left 15m late
    assert on_time[1]["eta"] == "2026-09-22T09:55:00"
    assert delayed[1]["eta"] == "2026-09-22T10:10:00"   # every downstream ETA shifted +15m


# --- golden case: sequencer -> ETA end to end --------------------------------
def test_eta_kasun_golden_all_on_time():
    ordered = route_sequencer(GOLDEN["stops"])
    # Depart Colombo 13:00; ~2h to the first Kandy stop, 15m between stops.
    out = eta_calculator(ordered, leg_durations_min=[120, 15], start_time="2026-09-22T13:00:00")
    assert len(out) == 2
    assert out[0]["eta"] == "2026-09-22T15:00:00"
    assert out[1]["eta"] == "2026-09-22T15:15:00"
    assert all(s["on_time"] is True for s in out)       # both within the 17:00 window
