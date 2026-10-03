# [S2] Order Compatibility Engine for Multi-Order Consolidation
#
# Deterministically evaluates pickup, drop-off, delivery date, time windows,
# load constraints, and special handling requirements before fleet allocation.

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Tuple


def _normalize_date(date_str: str | None) -> str:
    if not date_str:
        return ""
    try:
        # Extract YYYY-MM-DD
        if "T" in date_str:
            return date_str.split("T")[0]
        return date_str.strip()
    except Exception:
        return str(date_str)


def _parse_time_to_minutes(time_str: str | None) -> int | None:
    if not time_str:
        return None
    try:
        ts = time_str.strip()
        if "T" in ts:
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            return dt.hour * 60 + dt.minute
        # Handle formats like "10:00", "10:00:00", "10:00 AM"
        if "AM" in ts.upper() or "PM" in ts.upper():
            dt = datetime.strptime(ts, "%I:%M %p")
            return dt.hour * 60 + dt.minute
        parts = ts.split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return None


def are_orders_compatible(order_a: Dict[str, Any], order_b: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Evaluates pair-wise compatibility between two orders based on:
    1. Delivery Date (hard match)
    2. Pickup Location (must match or be on supported route)
    3. Drop-off Location (must match or be on supported route)
    4. Delivery Time Window (feasibility / overlap)
    5. Special handling / constraints
    """
    # 1. Delivery Date Compatibility (Hard Constraint)
    date_a = _normalize_date(order_a.get("delivery_date") or order_a.get("date") or order_a.get("deliveryWindowStart"))
    date_b = _normalize_date(order_b.get("delivery_date") or order_b.get("date") or order_b.get("deliveryWindowStart"))

    if date_a and date_b and date_a != date_b:
        return False, f"Incompatible delivery dates: Order {order_a.get('id')} ({date_a}) vs Order {order_b.get('id')} ({date_b})"

    # 2. Pickup Location Compatibility
    pickup_a = str(order_a.get("pickup_location") or order_a.get("pickup") or "Colombo").strip().lower()
    pickup_b = str(order_b.get("pickup_location") or order_b.get("pickup") or "Colombo").strip().lower()

    if pickup_a != pickup_b:
        return False, f"Incompatible pickup locations: Order {order_a.get('id')} ({pickup_a.title()}) vs Order {order_b.get('id')} ({pickup_b.title()})"

    # 3. Drop-off Location Compatibility
    drop_a = str(order_a.get("dropoff_location") or order_a.get("destination") or order_a.get("dropoff") or "").strip().lower()
    drop_b = str(order_b.get("dropoff_location") or order_b.get("destination") or order_b.get("dropoff") or "").strip().lower()

    # Route sequence check: If dropoffs are different (e.g. Kandy vs Galle), reject automatic grouping
    if drop_a and drop_b and drop_a != drop_b:
        # Check if known sequence or region exists, otherwise reject automatic consolidation
        allowed_corridors = [
            {"colombo", "kandy", "matale"},
            {"colombo", "dehiwala", "mount lavinia", "moratuwa"},
        ]
        in_same_corridor = any(drop_a in c and drop_b in c for c in allowed_corridors)
        if not in_same_corridor:
            return False, f"Incompatible drop-off locations: Order {order_a.get('id')} ({drop_a.title()}) vs Order {order_b.get('id')} ({drop_b.title()})"

    # 4. Delivery Time Window Feasibility
    start_a = _parse_time_to_minutes(order_a.get("delivery_window_start") or order_a.get("deliveryWindowStart"))
    end_a = _parse_time_to_minutes(order_a.get("delivery_window_end") or order_a.get("deliveryWindowEnd"))
    start_b = _parse_time_to_minutes(order_b.get("delivery_window_start") or order_b.get("deliveryWindowStart"))
    end_b = _parse_time_to_minutes(order_b.get("delivery_window_end") or order_b.get("deliveryWindowEnd"))

    if start_a is not None and end_a is not None and start_b is not None and end_b is not None:
        # Check if time windows have overlap or reasonable buffer
        latest_start = max(start_a, start_b)
        earliest_end = min(end_a, end_b)
        
        # If windows do not overlap at all (e.g., 08:00-10:00 vs 16:00-18:00)
        if latest_start > earliest_end:
            gap_minutes = latest_start - earliest_end
            if gap_minutes > 120:  # Gap greater than 2 hours is incompatible for single trip window
                return False, f"Incompatible time windows: Order {order_a.get('id')} window end is before Order {order_b.get('id')} window start with {gap_minutes}min gap"

    # 5. Special Handling Requirements
    flags_a = set(order_a.get("special_handling") or [])
    flags_b = set(order_b.get("special_handling") or [])
    if ("HAZMAT" in flags_a and "FOOD" in flags_b) or ("HAZMAT" in flags_b and "FOOD" in flags_a):
        return False, f"Incompatible cargo: Cannot consolidate HAZMAT with FOOD items"

    return True, "Orders are compatible for consolidation"


def evaluate_group_compatibility(orders: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Evaluates an entire candidate group of orders for consolidation compatibility.
    Identifies compatible orders and flags any incompatible orders with explicit reasons.
    """
    if not orders:
        return {
            "is_compatible": True,
            "compatible_order_ids": [],
            "incompatible_order_ids": [],
            "reasons": ["No orders provided"],
            "total_weight_kg": 0.0,
            "total_volume_m3": 0.0,
            "destinations": [],
        }

    if len(orders) == 1:
        single = orders[0]
        o_id = str(single.get("id") or single.get("order_id") or "ORD-1")
        return {
            "is_compatible": True,
            "compatible_order_ids": [o_id],
            "incompatible_order_ids": [],
            "reasons": ["Single order is inherently self-compatible"],
            "total_weight_kg": float(single.get("weight_kg") or single.get("weightKg") or single.get("weight") or 0.0),
            "total_volume_m3": float(single.get("volume_m3") or single.get("volumeM3") or single.get("volume") or 0.0),
            "destinations": [str(single.get("dropoff_location") or single.get("destination") or "Colombo")],
        }

    base_order = orders[0]
    base_id = str(base_order.get("id") or base_order.get("order_id") or "ORD-1")
    compatible_ids = [base_id]
    incompatible_ids = []
    reasons = [f"Base order {base_id} initialized candidate trip group"]

    for other_order in orders[1:]:
        other_id = str(other_order.get("id") or other_order.get("order_id") or "ORD-X")
        is_compat, reason = are_orders_compatible(base_order, other_order)
        if is_compat:
            compatible_ids.append(other_id)
            reasons.append(f"Order {other_id} compatible with {base_id}")
        else:
            incompatible_ids.append(other_id)
            reasons.append(reason)

    all_compatible = len(incompatible_ids) == 0

    compatible_orders = [o for o in orders if str(o.get("id") or o.get("order_id")) in compatible_ids]

    total_weight = sum(
        float(o.get("weight_kg") or o.get("weightKg") or o.get("weight") or 0.0)
        for o in compatible_orders
    )
    total_volume = sum(
        float(o.get("volume_m3") or o.get("volumeM3") or o.get("volume") or 0.0)
        for o in compatible_orders
    )
    destinations = list(set(
        str(o.get("dropoff_location") or o.get("destination") or "Colombo")
        for o in compatible_orders
    ))

    return {
        "is_compatible": all_compatible,
        "compatible_order_ids": compatible_ids,
        "incompatible_order_ids": incompatible_ids,
        "reasons": reasons,
        "total_weight_kg": total_weight,
        "total_volume_m3": total_volume,
        "destinations": destinations,
    }
