"""Deterministic, allow-listed S3 warehouse validation tools.

All persisted warehouse and dispatch information is read through the ASP.NET
Core API. These tools never connect to PostgreSQL and never ask an LLM to make
safety decisions.
"""
from __future__ import annotations

from decimal import Decimal
from typing import Any

import httpx

from app.config import BACKEND_API_BASE_URL

_BATCH_CONTEXT_SCHEMA = "batch_validation_context"
_CAPACITY_RESULT_SCHEMA = "capacity_result"
_STOCK_RESULT_SCHEMA = "stock_result"
_COMPATIBILITY_RESULT_SCHEMA = "compatibility_result"
_REQUEST_TIMEOUT_SECONDS = 10.0


class WarehouseToolError(ValueError):
    """Raised when a tool receives incomplete or unsafe validation context."""


class WarehouseBackendError(RuntimeError):
    """Raised when the S3 backend context cannot be obtained."""


def fetch_batch_validation_context(batch_id: str) -> dict[str, Any]:
    """Read one persisted S3 batch and its packages from the backend API."""
    if not _is_non_empty_string(batch_id):
        raise WarehouseToolError("batch_id is required")

    url = f"{BACKEND_API_BASE_URL.rstrip('/')}/api/dispatch/batches/{batch_id}/context"
    try:
        response = httpx.get(url, timeout=_REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
        payload = response.json()
    except httpx.HTTPError as exception:
        raise WarehouseBackendError("S3 batch validation context could not be retrieved") from exception
    except (TypeError, ValueError) as exception:
        raise WarehouseBackendError("S3 batch validation context was not valid JSON") from exception

    _require_schema(payload, _BATCH_CONTEXT_SCHEMA)
    return payload


def capacity_calculator(batch_id: str, vehicle_id: str | None = None) -> dict[str, Any]:
    """Calculate package totals against backend-supplied explicit vehicle limits."""
    context = fetch_batch_validation_context(batch_id)
    if vehicle_id is not None and (
        not _is_non_empty_string(vehicle_id) or vehicle_id != context["vehicleId"]
    ):
        raise WarehouseToolError("vehicle_id does not match the persisted dispatch batch")

    total_weight = sum((_decimal(package["weightKg"]) for package in context["packages"]), Decimal())
    total_volume = sum((_decimal(package["volumeM3"]) for package in context["packages"]), Decimal())
    max_weight = _decimal(context["maxWeightKg"])
    max_volume = _decimal(context["maxVolumeM3"])
    backend_totals_match = (
        total_weight == _decimal(context["totalWeightKg"])
        and total_volume == _decimal(context["totalVolumeM3"])
    )

    result = {
        "batch_id": context["batchId"],
        "vehicle_id": context["vehicleId"],
        "total_weight_kg": float(total_weight),
        "total_volume_m3": float(total_volume),
        "max_weight_kg": float(max_weight),
        "max_volume_m3": float(max_volume),
        "within_weight_capacity": total_weight <= max_weight,
        "within_volume_capacity": total_volume <= max_volume,
        "backend_totals_match": backend_totals_match,
    }
    _require_schema(result, _CAPACITY_RESULT_SCHEMA)
    return result


def warehouse_stock_query(
    batch_id: str,
    warehouse_id: str,
    package_ids: list[str] | None = None,
    expected_status: str = "Reserved",
) -> dict[str, Any]:
    """Validate package membership, warehouse presence, and dispatch state."""
    if not _is_non_empty_string(warehouse_id):
        raise WarehouseToolError("warehouse_id is required")
    if not _is_non_empty_string(expected_status):
        raise WarehouseToolError("expected_status is required")

    context = fetch_batch_validation_context(batch_id)
    requested_package_ids = (
        [package["packageId"] for package in context["packages"]]
        if package_ids is None
        else package_ids
    )
    _require_package_ids(requested_package_ids)

    packages_by_id = {package["packageId"]: package for package in context["packages"]}
    package_results: list[dict[str, Any]] = []

    for package_id in requested_package_ids:
        package = packages_by_id.get(package_id)
        exists = package is not None
        belongs_to_warehouse = exists and package["warehouseId"] == warehouse_id
        belongs_to_batch = exists
        has_expected_status = exists and package["status"] == expected_status
        already_dispatched = exists and package["status"] == "Dispatched"
        package_results.append(
            {
                "package_id": package_id,
                "exists": exists,
                "belongs_to_expected_warehouse": belongs_to_warehouse,
                "belongs_to_batch": belongs_to_batch,
                "has_expected_dispatch_state": has_expected_status,
                "already_dispatched": already_dispatched,
            }
        )

    result = {
        "batch_id": context["batchId"],
        "warehouse_id": warehouse_id,
        "batch_warehouse_id": context["warehouseId"],
        "expected_status": expected_status,
        "packages": package_results,
        "all_packages_present": all(package["exists"] for package in package_results),
        "all_belong_to_expected_warehouse": all(
            package["belongs_to_expected_warehouse"] for package in package_results
        ),
        "all_belong_to_batch": all(package["belongs_to_batch"] for package in package_results),
        "all_in_expected_dispatch_state": all(
            package["has_expected_dispatch_state"] for package in package_results
        ),
        "none_dispatched": all(not package["already_dispatched"] for package in package_results),
    }
    result["valid"] = (
        result["all_packages_present"]
        and result["all_belong_to_expected_warehouse"]
        and result["all_belong_to_batch"]
        and result["all_in_expected_dispatch_state"]
        and result["none_dispatched"]
    )
    _require_schema(result, _STOCK_RESULT_SCHEMA)
    return result


def compatibility_rules(batch_id: str) -> dict[str, Any]:
    """Validate the persisted deterministic Phase 2 LoadSequence safety rule."""
    context = fetch_batch_validation_context(batch_id)
    ordered_packages = sorted(context["packages"], key=lambda package: package["loadSequence"])
    sequences = [package["loadSequence"] for package in ordered_packages]
    load_sequence_valid = sequences == list(range(1, len(ordered_packages) + 1))

    first_fragile_index = next(
        (index for index, package in enumerate(ordered_packages) if package["isFragile"]),
        None,
    )
    fragile_not_under_heavy = (
        load_sequence_valid
        and (
            first_fragile_index is None
            or all(package["isFragile"] for package in ordered_packages[first_fragile_index:])
        )
    )

    result = {
        "batch_id": context["batchId"],
        "load_sequence_valid": load_sequence_valid,
        "fragile_not_under_heavy": fragile_not_under_heavy,
        "valid": fragile_not_under_heavy,
    }
    _require_schema(result, _COMPATIBILITY_RESULT_SCHEMA)
    return result


def schema_validator(payload: dict[str, Any], schema_name: str) -> bool:
    """Strictly validate supported tool boundary payloads without coercion."""
    if not isinstance(payload, dict):
        return False

    if schema_name == _BATCH_CONTEXT_SCHEMA:
        return _is_batch_context(payload)
    if schema_name == _CAPACITY_RESULT_SCHEMA:
        return _has_keys_of_types(
            payload,
            {
                "batch_id": _is_non_empty_string,
                "vehicle_id": _is_non_empty_string,
                "total_weight_kg": _is_non_negative_number,
                "total_volume_m3": _is_non_negative_number,
                "max_weight_kg": _is_positive_number,
                "max_volume_m3": _is_positive_number,
                "within_weight_capacity": _is_bool,
                "within_volume_capacity": _is_bool,
                "backend_totals_match": _is_bool,
            },
        )
    if schema_name == _STOCK_RESULT_SCHEMA:
        return _has_keys_of_types(
            payload,
            {
                "batch_id": _is_non_empty_string,
                "warehouse_id": _is_non_empty_string,
                "batch_warehouse_id": _is_non_empty_string,
                "expected_status": _is_non_empty_string,
                "packages": _is_list,
                "all_packages_present": _is_bool,
                "all_belong_to_expected_warehouse": _is_bool,
                "all_belong_to_batch": _is_bool,
                "all_in_expected_dispatch_state": _is_bool,
                "none_dispatched": _is_bool,
                "valid": _is_bool,
            },
        ) and all(
            _has_keys_of_types(
                package,
                {
                    "package_id": _is_non_empty_string,
                    "exists": _is_bool,
                    "belongs_to_expected_warehouse": _is_bool,
                    "belongs_to_batch": _is_bool,
                    "has_expected_dispatch_state": _is_bool,
                    "already_dispatched": _is_bool,
                },
            )
            for package in payload["packages"]
        )
    if schema_name == _COMPATIBILITY_RESULT_SCHEMA:
        return _has_keys_of_types(
            payload,
            {
                "batch_id": _is_non_empty_string,
                "load_sequence_valid": _is_bool,
                "fragile_not_under_heavy": _is_bool,
                "valid": _is_bool,
            },
        )

    return False


def _require_schema(payload: Any, schema_name: str) -> None:
    if not schema_validator(payload, schema_name):
        raise WarehouseToolError(f"malformed {schema_name}")


def _is_batch_context(payload: dict[str, Any]) -> bool:
    if not _has_keys_of_types(
        payload,
        {
            "batchId": _is_non_empty_string,
            "warehouseId": _is_non_empty_string,
            "vehicleId": _is_non_empty_string,
            "batchStatus": _is_non_empty_string,
            "maxWeightKg": _is_positive_number,
            "maxVolumeM3": _is_positive_number,
            "totalWeightKg": _is_non_negative_number,
            "totalVolumeM3": _is_non_negative_number,
            "packages": _is_list,
        },
    ):
        return False

    package_ids: set[str] = set()
    for package in payload["packages"]:
        if not _has_keys_of_types(
            package,
            {
                "packageId": _is_non_empty_string,
                "warehouseId": _is_non_empty_string,
                "trackingCode": _is_non_empty_string,
                "status": _is_non_empty_string,
                "weightKg": _is_positive_number,
                "volumeM3": _is_positive_number,
                "isFragile": _is_bool,
                "loadSequence": _is_positive_integer,
            },
        ):
            return False
        if package["packageId"] in package_ids:
            return False
        package_ids.add(package["packageId"])
    return bool(package_ids)


def _has_keys_of_types(payload: Any, validators: dict[str, Any]) -> bool:
    return isinstance(payload, dict) and all(
        key in payload and validator(payload[key])
        for key, validator in validators.items()
    )


def _require_package_ids(package_ids: list[str]) -> None:
    if (
        not isinstance(package_ids, list)
        or not package_ids
        or any(not _is_non_empty_string(package_id) for package_id in package_ids)
        or len(set(package_ids)) != len(package_ids)
    ):
        raise WarehouseToolError("package_ids must be a non-empty list of unique strings")


def _decimal(value: Any) -> Decimal:
    if not _is_non_negative_number(value):
        raise WarehouseToolError("numeric validation context value is invalid")
    return Decimal(str(value))


def _is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _is_bool(value: Any) -> bool:
    return isinstance(value, bool)


def _is_list(value: Any) -> bool:
    return isinstance(value, list)


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _is_non_negative_number(value: Any) -> bool:
    return _is_number(value) and value >= 0


def _is_positive_number(value: Any) -> bool:
    return _is_number(value) and value > 0


def _is_positive_integer(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool) and value > 0
