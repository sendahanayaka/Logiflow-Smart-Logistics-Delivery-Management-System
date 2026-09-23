from __future__ import annotations

from typing import Any

import pytest

from app.tools import warehouse_tools


def _context(*, packages: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    package_data = packages or [
        {
            "packageId": "pkg-001",
            "warehouseId": "warehouse-001",
            "trackingCode": "PKG-001",
            "status": "Reserved",
            "weightKg": 400,
            "volumeM3": 4,
            "isFragile": False,
            "loadSequence": 1,
        },
        {
            "packageId": "pkg-002",
            "warehouseId": "warehouse-001",
            "trackingCode": "PKG-002",
            "status": "Reserved",
            "weightKg": 300,
            "volumeM3": 3,
            "isFragile": True,
            "loadSequence": 2,
        },
    ]
    return {
        "batchId": "batch-001",
        "warehouseId": "warehouse-001",
        "vehicleId": "VEH-TEST-001",
        "batchStatus": "Reserved",
        "maxWeightKg": 1000,
        "maxVolumeM3": 12,
        "totalWeightKg": sum(package["weightKg"] for package in package_data),
        "totalVolumeM3": sum(package["volumeM3"] for package in package_data),
        "packages": package_data,
    }


class _Response:
    def __init__(self, payload: dict[str, Any]) -> None:
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, Any]:
        return self._payload


def _mock_backend(monkeypatch: pytest.MonkeyPatch, payload: dict[str, Any]) -> list[str]:
    requested_urls: list[str] = []

    def get(url: str, *, timeout: float) -> _Response:
        requested_urls.append(url)
        assert timeout == 10.0
        return _Response(payload)

    monkeypatch.setattr(warehouse_tools.httpx, "get", get)
    return requested_urls


def test_capacity_calculator_uses_backend_context_and_explicit_capacity(
    monkeypatch: pytest.MonkeyPatch,
):
    urls = _mock_backend(monkeypatch, _context())

    result = warehouse_tools.capacity_calculator("batch-001", "VEH-TEST-001")

    assert result["within_weight_capacity"] is True
    assert result["within_volume_capacity"] is True
    assert result["total_weight_kg"] == 700
    assert result["total_volume_m3"] == 7
    assert result["backend_totals_match"] is True
    assert urls == ["http://localhost:5080/api/dispatch/batches/batch-001/context"]


def test_warehouse_stock_query_detects_missing_or_dispatched_packages(
    monkeypatch: pytest.MonkeyPatch,
):
    payload = _context()
    payload["packages"][1]["status"] = "Dispatched"
    _mock_backend(monkeypatch, payload)

    result = warehouse_tools.warehouse_stock_query(
        "batch-001",
        "warehouse-001",
        ["pkg-001", "pkg-002", "pkg-missing"],
    )

    assert result["valid"] is False
    assert result["all_packages_present"] is False
    assert result["none_dispatched"] is False
    assert result["packages"][2]["exists"] is False


def test_compatibility_rules_rejects_fragile_below_later_non_fragile_package(
    monkeypatch: pytest.MonkeyPatch,
):
    payload = _context(
        packages=[
            {
                "packageId": "pkg-fragile",
                "warehouseId": "warehouse-001",
                "trackingCode": "PKG-FRAGILE",
                "status": "Reserved",
                "weightKg": 100,
                "volumeM3": 1,
                "isFragile": True,
                "loadSequence": 1,
            },
            {
                "packageId": "pkg-heavy",
                "warehouseId": "warehouse-001",
                "trackingCode": "PKG-HEAVY",
                "status": "Reserved",
                "weightKg": 500,
                "volumeM3": 2,
                "isFragile": False,
                "loadSequence": 2,
            },
        ]
    )
    _mock_backend(monkeypatch, payload)

    result = warehouse_tools.compatibility_rules("batch-001")

    assert result["load_sequence_valid"] is True
    assert result["fragile_not_under_heavy"] is False
    assert result["valid"] is False


def test_schema_validator_rejects_incomplete_context_without_coercion():
    assert warehouse_tools.schema_validator(
        {"batchId": "batch-001"},
        "batch_validation_context",
    ) is False


def test_fetch_context_rejects_malformed_backend_payload(monkeypatch: pytest.MonkeyPatch):
    _mock_backend(monkeypatch, {"batchId": "batch-001"})

    with pytest.raises(warehouse_tools.WarehouseToolError):
        warehouse_tools.fetch_batch_validation_context("batch-001")
