"""
services/decision/route_cost.py

Transport Cost & Route Engine for KrishiNirnay.
Project Tagline: "Sahi Bhav Se, Samriddhi Ki Raah Pe"
Authority: SYRUS_PS02_MASTER.md (Sections 5, 15) & SYRUS_PS02_DIVISION_2_DECISION_RISK_ENGINE.md (Section 7)

Invariants:
1. Primary routing provider: OpenRouteService via current `api.heigit.org` endpoints.
   NEVER use the deprecated `api.openrouteservice.org` hostname.
2. Fallback hierarchy:
   ORS live -> cached route -> haversine * road-factor estimate
3. Estimated route values must be explicitly marked:
   is_estimate = True, source = "haversine_road_factor"
4. Transport formula:
   trips = ceil(quantity_qtl / vehicle_payload_qtl)
   transport_total = rate_per_km * route_distance_km * round_trip_factor * trips
   farmer_transport = transport_total * farmer_load_share
5. Weak route Go-blocking rule:
   If a close Go recommendation depends on a weak route estimate, block Go.
"""

from __future__ import annotations

import math
import logging
from typing import Tuple, Dict, Any, Optional
import httpx
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Known verified coordinates for core Maharashtra mandis
DEFAULT_MANDI_COORDINATES: Dict[str, Tuple[float, float]] = {
    # Mandi ID / Name -> (latitude, longitude)
    "Nashik APMC": (19.9975, 73.7898),
    "Pimpalgaon APMC": (20.1738, 73.9877),
    "Lasalgaon APMC": (20.1472, 74.2263),
    "Pune APMC": (18.5204, 73.8567),
    "Mumbai APMC (Vashi)": (19.0760, 72.9986),
    "Sangamner APMC": (19.5760, 74.2070),
    "Ahmednagar APMC": (19.0952, 74.7496),
    "Kalvan APMC": (20.4855, 73.9631),
    "Yeola APMC": (20.0435, 74.4878)
}


class RouteInfo(BaseModel):
    """Immutable routing details between origin and destination."""
    origin: str
    destination: str
    origin_coords: Tuple[float, float]
    dest_coords: Tuple[float, float]
    distance_km: float = Field(..., description="Route distance in kilometers")
    duration_hours: float = Field(..., description="Transit duration in hours")
    is_estimate: bool = Field(..., description="True if distance is an estimate rather than live ORS")
    source: str = Field(..., description="'ors_live', 'cache', or 'haversine_road_factor'")


class TransportCostBreakdown(BaseModel):
    """Transport cost calculation breakdown."""
    route_distance_km: float
    duration_hours: float
    is_estimate: bool
    source: str
    quantity_qtl: float
    vehicle_type: str
    vehicle_payload_qtl: float
    trips: int
    rate_per_km: float
    round_trip_factor: float
    gross_transport_total: float
    farmer_load_share: float
    final_transport_cost: float


class RouteCostEngine:
    """
    Manages route distance/time calculation and transport cost computation.
    """
    def __init__(
        self,
        ors_api_key: Optional[str] = None,
        base_url: str = "https://api.heigit.org/ors/v2/directions/driving-car",
        fallback_road_factor: float = 1.3,
        default_avg_speed_kmh: float = 40.0,
        weak_route_margin_buffer: float = 0.03
    ):
        self.ors_api_key = ors_api_key
        # Enforce current api.heigit.org endpoint, reject deprecated host
        if "api.openrouteservice.org" in base_url:
            raise ValueError(
                "Deprecated routing host 'api.openrouteservice.org' prohibited. "
                "Must use current 'api.heigit.org' endpoints."
            )
        self.base_url = base_url
        self.fallback_road_factor = fallback_road_factor
        self.default_avg_speed_kmh = default_avg_speed_kmh
        self.weak_route_margin_buffer = weak_route_margin_buffer
        self._route_cache: Dict[Tuple[str, str], RouteInfo] = {}

    @staticmethod
    def haversine_distance(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """Computes great-circle distance between two (lat, lon) pairs in km."""
        lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
        lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2.0)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2.0)**2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        radius_earth_km = 6371.0
        return float(radius_earth_km * c)

    def get_route(
        self,
        origin_name: str,
        dest_name: str,
        origin_coords: Optional[Tuple[float, float]] = None,
        dest_coords: Optional[Tuple[float, float]] = None,
        use_live: bool = True
    ) -> RouteInfo:
        """
        Retrieves route via fallback hierarchy:
          ORS live -> cached route -> haversine * road-factor estimate
        """
        # Resolve coords
        o_coords = origin_coords or DEFAULT_MANDI_COORDINATES.get(origin_name)
        d_coords = dest_coords or DEFAULT_MANDI_COORDINATES.get(dest_name)

        if d_coords is None:
            # Fallback to default Nashik APMC coords if destination coords missing
            d_coords = DEFAULT_MANDI_COORDINATES.get("Nashik APMC", (19.9975, 73.7898))

        if o_coords is None:
            if origin_name == "farm_gate":
                # Representative local farm gate location (15 km radius from destination)
                o_coords = (d_coords[0] - 0.10, d_coords[1] - 0.10)
            else:
                o_coords = DEFAULT_MANDI_COORDINATES.get("Nashik APMC", (19.9975, 73.7898))

        cache_key = (origin_name, dest_name)

        # Zero distance if origin == destination
        if origin_name == dest_name or (abs(o_coords[0] - d_coords[0]) < 1e-4 and abs(o_coords[1] - d_coords[1]) < 1e-4):
            return RouteInfo(
                origin=origin_name,
                destination=dest_name,
                origin_coords=o_coords,
                dest_coords=d_coords,
                distance_km=0.0,
                duration_hours=0.0,
                is_estimate=False,
                source="same_location"
            )

        # 1. ORS Live call if enabled and key is available
        if use_live and self.ors_api_key:
            try:
                # OpenRouteService expects [longitude, latitude] in coordinates
                headers = {
                    "Authorization": self.ors_api_key,
                    "Content-Type": "application/json"
                }
                body = {
                    "coordinates": [
                        [o_coords[1], o_coords[0]],
                        [d_coords[1], d_coords[0]]
                    ]
                }
                with httpx.Client(timeout=4.0) as client:
                    resp = client.post(self.base_url, headers=headers, json=body)
                    if resp.status_code == 200:
                        data = resp.json()
                        summary = data["routes"][0]["summary"]
                        dist_km = summary["distance"] / 1000.0
                        dur_hrs = summary["duration"] / 3600.0
                        route_info = RouteInfo(
                            origin=origin_name,
                            destination=dest_name,
                            origin_coords=o_coords,
                            dest_coords=d_coords,
                            distance_km=round(dist_km, 2),
                            duration_hours=round(dur_hrs, 2),
                            is_estimate=False,
                            source="ors_live"
                        )
                        self._route_cache[cache_key] = route_info
                        return route_info
                    else:
                        logger.warning("ORS API returned status %d. Falling back.", resp.status_code)
            except Exception as e:
                logger.warning("Live ORS call failed (%s). Proceeding to cache/fallback.", e)

        # 2. Check cache
        if cache_key in self._route_cache:
            cached = self._route_cache[cache_key]
            return cached

        # 3. Fallback: Haversine * road-factor
        crow_flies_km = self.haversine_distance(o_coords, d_coords)
        estimated_road_km = crow_flies_km * self.fallback_road_factor
        estimated_duration_hours = estimated_road_km / self.default_avg_speed_kmh

        route_info = RouteInfo(
            origin=origin_name,
            destination=dest_name,
            origin_coords=o_coords,
            dest_coords=d_coords,
            distance_km=round(estimated_road_km, 2),
            duration_hours=round(estimated_duration_hours, 2),
            is_estimate=True,
            source="haversine_road_factor"
        )
        self._route_cache[cache_key] = route_info
        return route_info

    def set_cached_route(self, route_info: RouteInfo) -> None:
        """Manually populate route cache with verified historical route."""
        key = (route_info.origin, route_info.destination)
        self._route_cache[key] = route_info

    def calculate_transport_cost(
        self,
        route_distance_km: float,
        duration_hours: float,
        quantity_qtl: float,
        rate_per_km: float = 12.0,
        round_trip_factor: float = 2.0,
        vehicle_payload_qtl: float = 25.0,
        vehicle_type: str = "medium_truck",
        shared_transport: bool = False,
        farmer_load_share: float = 1.0,
        is_estimate: bool = False,
        source: str = "configured"
    ) -> TransportCostBreakdown:
        """
        Computes transport cost using canonical formula:
          trips = ceil(quantity_qtl / vehicle_payload_qtl)
          transport_total = rate_per_km * route_distance_km * round_trip_factor * trips
          farmer_transport = transport_total * farmer_load_share
        """
        if quantity_qtl <= 0:
            raise ValueError(f"Quantity must be positive, got {quantity_qtl}")
        if vehicle_payload_qtl <= 0:
            raise ValueError(f"Vehicle payload must be positive, got {vehicle_payload_qtl}")
        if farmer_load_share <= 0 or farmer_load_share > 1.0:
            raise ValueError(f"Farmer load share must be in (0, 1.0], got {farmer_load_share}")

        if route_distance_km <= 0:
            return TransportCostBreakdown(
                route_distance_km=0.0,
                duration_hours=0.0,
                is_estimate=is_estimate,
                source=source,
                quantity_qtl=quantity_qtl,
                vehicle_type=vehicle_type,
                vehicle_payload_qtl=vehicle_payload_qtl,
                trips=1,
                rate_per_km=rate_per_km,
                round_trip_factor=round_trip_factor,
                gross_transport_total=0.0,
                farmer_load_share=farmer_load_share,
                final_transport_cost=0.0
            )

        trips = math.ceil(quantity_qtl / vehicle_payload_qtl)
        gross_transport_total = (
            float(rate_per_km) *
            float(route_distance_km) *
            float(round_trip_factor) *
            float(trips)
        )

        effective_share = farmer_load_share if shared_transport else 1.0
        final_transport_cost = gross_transport_total * effective_share

        return TransportCostBreakdown(
            route_distance_km=float(route_distance_km),
            duration_hours=float(duration_hours),
            is_estimate=is_estimate,
            source=source,
            quantity_qtl=float(quantity_qtl),
            vehicle_type=vehicle_type,
            vehicle_payload_qtl=float(vehicle_payload_qtl),
            trips=int(trips),
            rate_per_km=float(rate_per_km),
            round_trip_factor=float(round_trip_factor),
            gross_transport_total=round(gross_transport_total, 2),
            farmer_load_share=round(effective_share, 4),
            final_transport_cost=round(final_transport_cost, 2)
        )

    def is_route_safe_for_go(
        self,
        gain_pct: float,
        required_gain_pct: float,
        route_info: RouteInfo
    ) -> Tuple[bool, Optional[str]]:
        """
        Enforces Go Block Rule:
        If a close Go recommendation depends on a weak route estimate,
        block Go instead of pretending the route is reliable.
        """
        if not route_info.is_estimate:
            return True, None

        # When route is an estimate, require a safety buffer over minimum gain
        margin_above_gate = gain_pct - required_gain_pct
        if margin_above_gate < self.weak_route_margin_buffer:
            reason = (
                f"GO BLOCKED: Candidate gain ({gain_pct*100:.1f}%) is within the "
                f"uncertainty margin of estimated route distance ({route_info.distance_km:.1f} km, "
                f"source: {route_info.source}). Live road verification required."
            )
            return False, reason

        return True, None
