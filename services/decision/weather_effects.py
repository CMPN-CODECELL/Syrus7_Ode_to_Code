"""
services/decision/weather_effects.py

Weather-to-Economics & Weather Risk Adapter for KrishiNirnay.
Project Tagline: "Sahi Bhav Se, Samriddhi Ki Raah Pe"
Authority: SYRUS_PS02_MASTER.md (Section 14) & SYRUS_PS02_DIVISION_2_DECISION_RISK_ENGINE.md (Sections 20.6, 23, 24)

Invariants:
1. Weather must have economics/risk consequences, but NEVER receives a fake hard-coded market-price bump.
   (Prohibited: rain = +₹200).
2. Direct economic consequences allowed:
   - weather -> holding loss multiplier
   - weather -> travel time / transit disruption multiplier
   - weather -> travel loss multiplier
   - weather -> quality factor adjustment
3. External sources:
   - Open-Meteo for numerical weather (temperature, precipitation)
   - IMD for official meteorological warning level (GREEN, YELLOW, RED)
4. Graceful fallback when weather is unavailable:
   - NEVER invent weather effects when the provider fails.
"""

from __future__ import annotations

import logging
from typing import Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class WeatherContext(BaseModel):
    """Normalized weather observations and warning context."""
    location_name: str
    latitude: float
    longitude: float
    temperature_max_c: Optional[float] = Field(None, description="Maximum daytime temperature in Celsius")
    rainfall_mm_24h: Optional[float] = Field(None, description="24-hour cumulative rainfall in mm")
    imd_warning_color: str = Field("NONE", description="'GREEN', 'YELLOW', 'ORANGE', 'RED', or 'NONE'")
    is_coastal: bool = Field(False, description="True for coastal Maharashtra zones (e.g. Mumbai/Konkan)")
    is_available: bool = Field(True, description="False if external weather provider was down")
    source: str = Field("open_meteo_imd", description="Provider source or fallback indicator")
    notes: list[str] = Field(default_factory=list)


class WeatherEconomicImpact(BaseModel):
    """Calculated deterministic economic multipliers derived from weather."""
    holding_loss_multiplier: float = Field(1.0, description="Multiplier applied to daily holding loss")
    travel_time_multiplier: float = Field(1.0, description="Transit delay multiplier (e.g. road slowdown from rain)")
    travel_loss_multiplier: float = Field(1.0, description="Multiplier applied to hourly transit loss")
    quality_factor_delta: float = Field(0.0, description="Deduction from quality factor due to weather damage (default 0.0)")
    weather_risk_status: str = Field("GREEN", description="Flag status: GREEN, YELLOW, or RED")
    weather_risk_score: float = Field(0.0, description="0.0 for Green, 0.5 for Yellow, 1.0 for Red")
    weather_risk_reason: str = Field("Normal weather conditions", description="Deterministic explanation")


class WeatherEffectsEngine:
    """
    Evaluates weather risk and deterministic economic adjustments.
    """
    def __init__(
        self,
        yellow_temp_c: float = 35.0,
        yellow_rain_mm: float = 15.6,
        red_temp_c: float = 40.0,
        red_temp_coastal_c: float = 37.0,
        red_rain_mm: float = 64.5
    ):
        self.yellow_temp_c = yellow_temp_c
        self.yellow_rain_mm = yellow_rain_mm
        self.red_temp_c = red_temp_c
        self.red_temp_coastal_c = red_temp_coastal_c
        self.red_rain_mm = red_rain_mm

    def evaluate_weather(
        self,
        weather: Optional[WeatherContext]
    ) -> WeatherEconomicImpact:
        """
        Determines deterministic risk flag and economic impacts.
        If weather is unavailable, no effects are fabricated.
        """
        if weather is None or not weather.is_available:
            return WeatherEconomicImpact(
                holding_loss_multiplier=1.0,
                travel_time_multiplier=1.0,
                travel_loss_multiplier=1.0,
                quality_factor_delta=0.0,
                weather_risk_status="GREEN",
                weather_risk_score=0.0,
                weather_risk_reason="Weather service unavailable; no weather disruption assumed"
            )

        imd_color = (weather.imd_warning_color or "NONE").upper()
        temp = weather.temperature_max_c
        rain = weather.rainfall_mm_24h
        is_coastal = weather.is_coastal

        effective_red_temp = self.red_temp_coastal_c if is_coastal else self.red_temp_c

        # 1. Evaluate Red severity
        is_red = False
        red_reasons = []

        if imd_color in ("RED", "ORANGE"):
            is_red = True
            red_reasons.append(f"Official IMD {imd_color} Warning")
        if temp is not None and temp >= effective_red_temp:
            is_red = True
            zone_desc = "coastal" if is_coastal else "inland"
            red_reasons.append(f"Extreme heat ({temp}°C >= {effective_red_temp}°C threshold for {zone_desc} zone)")
        if rain is not None and rain >= self.red_rain_mm:
            is_red = True
            red_reasons.append(f"Heavy rainfall ({rain} mm/24h >= {self.red_rain_mm} mm threshold)")

        if is_red:
            return WeatherEconomicImpact(
                holding_loss_multiplier=1.50, # 50% increase in holding decay under extreme heat/humidity
                travel_time_multiplier=1.40,   # 40% transit delay due to road waterlogging/rain
                travel_loss_multiplier=1.30,   # 30% higher heat/vibration handling loss
                quality_factor_delta=-0.05,    # 5% quality discount for exposed produce
                weather_risk_status="RED",
                weather_risk_score=1.0,
                weather_risk_reason="; ".join(red_reasons)
            )

        # 2. Evaluate Yellow severity
        is_yellow = False
        yellow_reasons = []

        if imd_color == "YELLOW":
            is_yellow = True
            yellow_reasons.append("Official IMD Yellow Watch")
        if temp is not None and temp >= self.yellow_temp_c:
            is_yellow = True
            yellow_reasons.append(f"Elevated heat ({temp}°C >= {self.yellow_temp_c}°C)")
        if rain is not None and rain >= self.yellow_rain_mm:
            is_yellow = True
            yellow_reasons.append(f"Moderate rainfall ({rain} mm/24h >= {self.yellow_rain_mm} mm)")

        if is_yellow:
            return WeatherEconomicImpact(
                holding_loss_multiplier=1.20, # 20% faster spoilage under moderate heat/humidity
                travel_time_multiplier=1.20,   # 20% transit delay
                travel_loss_multiplier=1.15,   # 15% transit loss increment
                quality_factor_delta=0.0,
                weather_risk_status="YELLOW",
                weather_risk_score=0.5,
                weather_risk_reason="; ".join(yellow_reasons)
            )

        # 3. Normal / Green
        return WeatherEconomicImpact(
            holding_loss_multiplier=1.0,
            travel_time_multiplier=1.0,
            travel_loss_multiplier=1.0,
            quality_factor_delta=0.0,
            weather_risk_status="GREEN",
            weather_risk_score=0.0,
            weather_risk_reason="Weather conditions benign (within seasonal tolerances)"
        )
