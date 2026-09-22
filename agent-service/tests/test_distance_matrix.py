# [S4] Phase 3 tests — OSRM distance-matrix tool + haversine fallback.
# NO real network: OSRM is monkeypatched; the fallback path is exercised by
# forcing the call to fail. Keeps agent-ci green and hermetic.
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.tools import routing_tools
from app.tools.routing_tools import (
    _haversine_km,
    distance_matrix,
    eta_calculator,
    route_legs,
    route_sequencer,
)

GOLDEN = json.loads((Path(__file__).parent / "golden_cases" / "kasun_case.json").read_text())

# Two points ~1 degree of longitude apart at the equator (~111 km).
P = [{"lat": 0.0, "lng": 0.0}, {"lat": 0.0, "lng": 1.0}]


class _FakeResp:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


def _fake_get(payload):
    def _get(url, params=None, timeout=None):
        return _FakeResp(payload)
    return _get


# --- OSRM success path -------------------------------------------------------
def test_osrm_success_parses_and_converts_units(monkeypatch):
    # 1500 s -> 25 min, 20000 m -> 20 km.
    payload = {
        "code": "Ok",
        "durations": [[0, 1500], [1500, 0]],
        "distances": [[0, 20000], [20000, 0]],
    }
    monkeypatch.setattr(routing_tools.httpx, "get", _fake_get(payload))
    out = distance_matrix(P)
    assert out["source"] == "osrm"
    assert out["durations_min"][0][1] == 25
    assert out["distances_km"][0][1] == 20
    assert out["distances_km"][0][0] == 0  # diagonal


# --- fallback paths ----------------------------------------------------------
def test_network_error_falls_back_to_haversine(monkeypatch):
    def boom(*a, **k):
        raise RuntimeError("connection refused")
    monkeypatch.setattr(routing_tools.httpx, "get", boom)
    out = distance_matrix(P)
    assert out["source"] == "haversine"
    # matches the pure helper (~111 km), symmetric, zero diagonal
    assert abs(out["distances_km"][0][1] - _haversine_km(0, 0, 0, 1)) < 0.01
    assert out["distances_km"][0][1] == out["distances_km"][1][0]
    assert out["durations_min"][0][0] == 0


def test_osrm_non_ok_code_falls_back(monkeypatch):
    monkeypatch.setattr(routing_tools.httpx, "get", _fake_get({"code": "NoRoute"}))
    assert distance_matrix(P)["source"] == "haversine"


def test_empty_points():
    out = distance_matrix([])
    assert out["source"] == "empty"
    assert out["distances_km"] == []


# --- route_legs + alignment with the ETA engine ------------------------------
def test_route_legs_has_leading_zero_and_matches_point_count(monkeypatch):
    def boom(*a, **k):
        raise RuntimeError("offline")
    monkeypatch.setattr(routing_tools.httpx, "get", boom)  # force haversine
    ordered = route_sequencer(GOLDEN["stops"])
    legs = route_legs(ordered)
    assert legs["source"] == "haversine"
    assert len(legs["leg_durations_min"]) == len(ordered)  # N entries for N points
    assert legs["leg_durations_min"][0] == 0.0             # already at the first stop
    assert legs["leg_durations_min"][1] > 0.0


def test_route_legs_feed_eta_calculator_end_to_end(monkeypatch):
    def boom(*a, **k):
        raise RuntimeError("offline")
    monkeypatch.setattr(routing_tools.httpx, "get", boom)  # deterministic fallback
    ordered = route_sequencer(GOLDEN["stops"])
    legs = route_legs(ordered)["leg_durations_min"]
    out = eta_calculator(ordered, leg_durations_min=legs, start_time="2026-09-22T13:00:00")
    assert len(out) == len(ordered)
    etas = [s["eta"] for s in out]
    assert etas == sorted(etas)  # ETAs are non-decreasing along the route
