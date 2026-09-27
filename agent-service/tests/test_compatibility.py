from __future__ import annotations

import pytest
from app.agents.order_compatibility import are_orders_compatible, evaluate_group_compatibility


# TEST 1: Same pickup + same drop-off + same date + compatible time window -> compatible
def test_same_pickup_dropoff_date_window_compatible():
    order_a = {
        "id": "ORD-101",
        "pickup_location": "Colombo",
        "dropoff_location": "Kandy",
        "delivery_date": "2026-09-25",
        "delivery_window_start": "10:00 AM",
        "delivery_window_end": "05:00 PM",
    }
    order_b = {
        "id": "ORD-102",
        "pickup_location": "Colombo",
        "dropoff_location": "Kandy",
        "delivery_date": "2026-09-25",
        "delivery_window_start": "10:00 AM",
        "delivery_window_end": "05:00 PM",
    }

    is_compat, reason = are_orders_compatible(order_a, order_b)
    assert is_compat is True
    assert "compatible" in reason.lower()


# TEST 2: Different pickup -> incompatible unless routing logic explicitly supports it
def test_different_pickup_incompatible():
    order_a = {
        "id": "ORD-101",
        "pickup_location": "Colombo",
        "dropoff_location": "Kandy",
        "delivery_date": "2026-09-25",
    }
    order_b = {
        "id": "ORD-102",
        "pickup_location": "Galle",
        "dropoff_location": "Kandy",
        "delivery_date": "2026-09-25",
    }

    is_compat, reason = are_orders_compatible(order_a, order_b)
    assert is_compat is False
    assert "pickup" in reason.lower()


# TEST 3: Different drop-off -> not automatically grouped
def test_different_dropoff_not_automatically_grouped():
    order_a = {
        "id": "ORD-101",
        "pickup_location": "Colombo",
        "dropoff_location": "Kandy",
        "delivery_date": "2026-09-25",
    }
    order_b = {
        "id": "ORD-102",
        "pickup_location": "Colombo",
        "dropoff_location": "Galle",
        "delivery_date": "2026-09-25",
    }

    is_compat, reason = are_orders_compatible(order_a, order_b)
    assert is_compat is False
    assert "drop-off" in reason.lower() or "dropoff" in reason.lower()


# TEST 4: Different delivery date -> incompatible
def test_different_delivery_date_incompatible():
    order_a = {
        "id": "ORD-101",
        "pickup_location": "Colombo",
        "dropoff_location": "Kandy",
        "delivery_date": "2026-09-25",
    }
    order_b = {
        "id": "ORD-102",
        "pickup_location": "Colombo",
        "dropoff_location": "Kandy",
        "delivery_date": "2026-09-27",
    }

    is_compat, reason = are_orders_compatible(order_a, order_b)
    assert is_compat is False
    assert "date" in reason.lower()


# TEST 5: Incompatible time windows -> reject
def test_incompatible_time_windows_rejected():
    order_a = {
        "id": "ORD-101",
        "pickup_location": "Colombo",
        "dropoff_location": "Kandy",
        "delivery_date": "2026-09-25",
        "delivery_window_start": "08:00 AM",
        "delivery_window_end": "10:00 AM",
    }
    order_b = {
        "id": "ORD-102",
        "pickup_location": "Colombo",
        "dropoff_location": "Kandy",
        "delivery_date": "2026-09-25",
        "delivery_window_start": "04:00 PM",
        "delivery_window_end": "06:00 PM",
    }

    is_compat, reason = are_orders_compatible(order_a, order_b)
    assert is_compat is False
    assert "window" in reason.lower() or "time" in reason.lower()


# TEST 6: Compatible time windows -> candidate
def test_compatible_time_windows_candidate():
    order_a = {
        "id": "ORD-101",
        "pickup_location": "Colombo",
        "dropoff_location": "Kandy",
        "delivery_date": "2026-09-25",
        "delivery_window_start": "10:00 AM",
        "delivery_window_end": "02:00 PM",
    }
    order_b = {
        "id": "ORD-102",
        "pickup_location": "Colombo",
        "dropoff_location": "Kandy",
        "delivery_date": "2026-09-25",
        "delivery_window_start": "12:00 PM",
        "delivery_window_end": "04:00 PM",
    }

    is_compat, reason = are_orders_compatible(order_a, order_b)
    assert is_compat is True


# TEST 7: Group evaluation identifies compatible & incompatible orders
def test_evaluate_group_compatibility():
    orders = [
        {
            "id": "ORD-101",
            "pickup_location": "Colombo",
            "dropoff_location": "Kandy",
            "delivery_date": "2026-09-25",
            "weight_kg": 10,
            "volume_m3": 0.05,
        },
        {
            "id": "ORD-102",
            "pickup_location": "Colombo",
            "dropoff_location": "Kandy",
            "delivery_date": "2026-09-25",
            "weight_kg": 15,
            "volume_m3": 0.07,
        },
        {
            "id": "ORD-103",
            "pickup_location": "Colombo",
            "dropoff_location": "Galle",  # Incompatible destination
            "delivery_date": "2026-09-25",
            "weight_kg": 20,
            "volume_m3": 0.1,
        },
    ]

    result = evaluate_group_compatibility(orders)
    assert result["is_compatible"] is False
    assert "ORD-101" in result["compatible_order_ids"]
    assert "ORD-102" in result["compatible_order_ids"]
    assert "ORD-103" in result["incompatible_order_ids"]
    assert result["total_weight_kg"] == 25.0
