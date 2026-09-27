# [S4] Phase 1 tests — route sequencer + haversine helper.
# Pure math: no Ollama, no network, no backend. Keeps agent-ci green.
from __future__ import annotations

import json
from pathlib import Path

from app.tools.routing_tools import _haversine_km, route_sequencer

GOLDEN = json.loads((Path(__file__).parent / "golden_cases" / "kasun_case.json").read_text())


# --- haversine helper --------------------------------------------------------
def test_haversine_one_degree_longitude_at_equator():
    # 1 degree of longitude at the equator is ~111 km.
    assert abs(_haversine_km(0.0, 0.0, 0.0, 1.0) - 111.19) < 1.0


def test_haversine_zero_distance():
    assert _haversine_km(7.29, 80.63, 7.29, 80.63) == 0.0


def test_haversine_is_symmetric():
    a = _haversine_km(6.9271, 79.8612, 7.2906, 80.6337)   # Colombo -> Kandy
    b = _haversine_km(7.2906, 80.6337, 6.9271, 79.8612)   # Kandy -> Colombo
    assert abs(a - b) < 1e-9


# --- sequencer: structure ----------------------------------------------------
def test_sequencer_empty_returns_empty():
    assert route_sequencer([]) == []


def test_sequencer_visits_every_stop_once_with_contiguous_sequence():
    stops = [
        {"stop_id": "a", "lat": 0.0, "lng": 0.0},
        {"stop_id": "b", "lat": 0.0, "lng": 0.2},
        {"stop_id": "c", "lat": 0.0, "lng": 0.5},
    ]
    out = route_sequencer(stops, start={"lat": 0.0, "lng": 0.0})
    assert [s["sequence"] for s in out] == [1, 2, 3]
    assert sorted(s["stop_id"] for s in out) == ["a", "b", "c"]


def test_sequencer_preserves_original_keys():
    stops = [{"stop_id": "a", "order_id": "ord-1", "lat": 0.0, "lng": 0.1}]
    out = route_sequencer(stops, start={"lat": 0.0, "lng": 0.0})
    assert out[0]["order_id"] == "ord-1"


# --- sequencer: the heuristic ------------------------------------------------
def test_sequencer_nearest_neighbour_order_from_depot():
    # From depot (0,0): a=0.1 deg, c=0.2 deg, b=0.5 deg east -> nearest-first is a, c, b.
    stops = [
        {"stop_id": "b", "lat": 0.0, "lng": 0.5},
        {"stop_id": "c", "lat": 0.0, "lng": 0.2},
        {"stop_id": "a", "lat": 0.0, "lng": 0.1},
    ]
    out = route_sequencer(stops, start={"lat": 0.0, "lng": 0.0})
    assert [s["stop_id"] for s in out] == ["a", "c", "b"]


def test_sequencer_first_leg_from_depot_has_distance():
    out = route_sequencer([{"stop_id": "a", "lat": 0.0, "lng": 1.0}], start={"lat": 0.0, "lng": 0.0})
    assert out[0]["sequence"] == 1
    assert out[0]["distance_from_prev_km"] > 100  # ~111 km


def test_sequencer_without_depot_first_stop_distance_is_zero():
    out = route_sequencer([
        {"stop_id": "a", "lat": 0.0, "lng": 0.0},
        {"stop_id": "b", "lat": 0.0, "lng": 0.3},
    ])
    assert out[0]["distance_from_prev_km"] == 0.0


def test_sequencer_window_tiebreak_prefers_earlier_deadline():
    # Two stops equidistant from the depot; the earlier window_end must come first.
    stops = [
        {"stop_id": "late", "lat": 0.0, "lng": 1.0, "window_end": "2026-09-22T17:00:00"},
        {"stop_id": "early", "lat": 0.0, "lng": -1.0, "window_end": "2026-09-22T12:00:00"},
    ]
    out = route_sequencer(stops, start={"lat": 0.0, "lng": 0.0})
    assert out[0]["stop_id"] == "early"


# --- sequencer: the golden case ----------------------------------------------
def test_sequencer_kasun_golden_two_stops():
    out = route_sequencer(GOLDEN["stops"])
    assert len(out) == len(GOLDEN["stops"]) == 2
    assert [s["sequence"] for s in out] == [1, 2]
    assert {s["stop_id"] for s in out} == {"s1", "s2"}
