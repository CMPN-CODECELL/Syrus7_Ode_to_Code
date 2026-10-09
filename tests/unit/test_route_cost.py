"""
tests/unit/test_route_cost.py

Unit tests for transport cost, route fallback hierarchy, vehicle payload/trips,
shared truck, and weak route Go-blocking.
"""

import pytest
import math
from services.decision.route_cost import (
    RouteCostEngine,
    RouteInfo,
    TransportCostBreakdown,
    DEFAULT_MANDI_COORDINATES
)


def test_routing_endpoint_contract():
    """Engine must reject deprecated api.openrouteservice.org hostname."""
    with pytest.raises(ValueError, match="Deprecated routing host"):
        RouteCostEngine(base_url="https://api.openrouteservice.org/v2/directions/driving-car")

    # Valid current api.heigit.org endpoint works
    engine = RouteCostEngine(base_url="https://api.heigit.org/ors/v2/directions/driving-car")
    assert "api.heigit.org" in engine.base_url


def test_haversine_and_fallback():
    """Verify haversine distance computation and estimate labelling."""
    engine = RouteCostEngine()
    
    nashik_coords = DEFAULT_MANDI_COORDINATES["Nashik APMC"]
    lasalgaon_coords = DEFAULT_MANDI_COORDINATES["Lasalgaon APMC"]
    
    dist_crow = engine.haversine_distance(nashik_coords, lasalgaon_coords)
    # Distance between Nashik and Lasalgaon is ~48 km straight line
    assert 40.0 < dist_crow < 60.0
    
    # Live disabled / no key triggers fallback to haversine * road factor (1.3)
    route = engine.get_route(
        origin_name="Nashik APMC",
        dest_name="Lasalgaon APMC",
        use_live=False
    )
    assert route.is_estimate is True
    assert route.source == "haversine_road_factor"
    assert math.isclose(route.distance_km, round(dist_crow * 1.3, 2), rel_tol=1e-3)
    assert route.duration_hours > 0


def test_vehicle_trips_and_transport_cost():
    """
    Test trips = ceil(quantity / payload) and transport_total formula:
      transport = rate_per_km * distance * round_trip_factor * trips
    """
    engine = RouteCostEngine()
    
    # Case 1: 1 trip (quantity 20 qtl <= payload 25 qtl)
    # 60 km, ₹12/km, round trip factor 2.0
    # Expected = 12 * 60 * 2 * 1 = 1440 Rs
    cost1 = engine.calculate_transport_cost(
        route_distance_km=60.0,
        duration_hours=1.5,
        quantity_qtl=20.0,
        rate_per_km=12.0,
        round_trip_factor=2.0,
        vehicle_payload_qtl=25.0
    )
    assert cost1.trips == 1
    assert cost1.final_transport_cost == 1440.0
    
    # Case 2: 2 trips (quantity 35 qtl > payload 25 qtl)
    # Expected = 12 * 60 * 2 * 2 = 2880 Rs
    cost2 = engine.calculate_transport_cost(
        route_distance_km=60.0,
        duration_hours=1.5,
        quantity_qtl=35.0,
        rate_per_km=12.0,
        round_trip_factor=2.0,
        vehicle_payload_qtl=25.0
    )
    assert cost2.trips == 2
    assert cost2.final_transport_cost == 2880.0


def test_shared_truck_transport():
    """Shared transport scales total transport cost by farmer_load_share."""
    engine = RouteCostEngine()
    
    # Farmer has 50% share of a truck load
    cost = engine.calculate_transport_cost(
        route_distance_km=60.0,
        duration_hours=1.5,
        quantity_qtl=12.5,
        rate_per_km=12.0,
        round_trip_factor=2.0,
        vehicle_payload_qtl=25.0,
        shared_transport=True,
        farmer_load_share=0.5
    )
    # Full transport = 1440 Rs. Farmer share (50%) = 720 Rs.
    assert cost.gross_transport_total == 1440.0
    assert cost.farmer_load_share == 0.5
    assert cost.final_transport_cost == 720.0


def test_weak_route_go_blocking():
    """
    If a close Go decision depends on a weak route estimate,
    block Go rather than pretending the route is exact.
    """
    engine = RouteCostEngine(weak_route_margin_buffer=0.03) # 3% safety buffer
    
    # Live route: safe even if gain is small
    live_route = RouteInfo(
        origin="Nashik",
        destination="Pune",
        origin_coords=(19.9, 73.7),
        dest_coords=(18.5, 73.8),
        distance_km=210.0,
        duration_hours=4.5,
        is_estimate=False,
        source="ors_live"
    )
    is_safe, reason = engine.is_route_safe_for_go(
        gain_pct=0.035, # 3.5%
        required_gain_pct=0.03, # 3.0%
        route_info=live_route
    )
    assert is_safe is True
    assert reason is None
    
    # Estimated route with close margin: BLOCKED
    est_route = RouteInfo(
        origin="Nashik",
        destination="Pune",
        origin_coords=(19.9, 73.7),
        dest_coords=(18.5, 73.8),
        distance_km=210.0,
        duration_hours=4.5,
        is_estimate=True,
        source="haversine_road_factor"
    )
    # Margin above gate is only 0.5% (0.035 - 0.030), which is < 3% buffer
    is_safe_est, block_reason = engine.is_route_safe_for_go(
        gain_pct=0.035,
        required_gain_pct=0.03,
        route_info=est_route
    )
    assert is_safe_est is False
    assert "GO BLOCKED" in block_reason
