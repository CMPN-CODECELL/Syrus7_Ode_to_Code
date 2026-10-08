"""
tests/unit/test_weather_effects.py

Unit tests for weather economics, threshold rules, and prohibition of fake price bumps.
"""

import pytest
from services.decision.weather_effects import (
    WeatherContext,
    WeatherEffectsEngine,
    WeatherEconomicImpact
)


def test_no_arbitrary_price_bump():
    """Weather engine produces loss and disruption multipliers, NEVER arbitrary price additions."""
    engine = WeatherEffectsEngine()
    
    rain_weather = WeatherContext(
        location_name="Nashik APMC",
        latitude=19.99,
        longitude=73.78,
        temperature_max_c=30.0,
        rainfall_mm_24h=75.0, # Heavy rain (Red)
        imd_warning_color="RED"
    )
    impact = engine.evaluate_weather(rain_weather)
    
    assert impact.weather_risk_status == "RED"
    assert impact.weather_risk_score == 1.0
    assert impact.holding_loss_multiplier > 1.0 # Higher spoilage
    assert impact.travel_time_multiplier > 1.0   # Slower transit
    
    # Assert there is NO attribute or mechanism for a price bump
    assert not hasattr(impact, "price_bump_inr")
    assert not hasattr(impact, "modal_price_delta")


def test_weather_yellow_thresholds():
    """Verify Yellow triggers: temp >= 35 C, rain >= 15.6 mm, or IMD Yellow."""
    engine = WeatherEffectsEngine()
    
    # Yellow via temperature
    w_temp = WeatherContext(
        location_name="Nashik",
        latitude=19.99,
        longitude=73.78,
        temperature_max_c=36.0,
        rainfall_mm_24h=5.0,
        imd_warning_color="NONE"
    )
    impact_temp = engine.evaluate_weather(w_temp)
    assert impact_temp.weather_risk_status == "YELLOW"
    assert impact_temp.weather_risk_score == 0.5

    # Yellow via rain
    w_rain = WeatherContext(
        location_name="Nashik",
        latitude=19.99,
        longitude=73.78,
        temperature_max_c=30.0,
        rainfall_mm_24h=20.0,
        imd_warning_color="NONE"
    )
    impact_rain = engine.evaluate_weather(w_rain)
    assert impact_rain.weather_risk_status == "YELLOW"


def test_weather_red_coastal_vs_inland():
    """Inland red threshold is 40 C, while coastal red threshold is 37 C."""
    engine = WeatherEffectsEngine()
    
    # Inland at 38 C is Yellow (not Red yet)
    w_inland = WeatherContext(
        location_name="Nashik",
        latitude=19.99,
        longitude=73.78,
        temperature_max_c=38.0,
        is_coastal=False
    )
    assert engine.evaluate_weather(w_inland).weather_risk_status == "YELLOW"

    # Coastal (e.g. Mumbai/Vashi) at 38 C is RED (exceeds 37 C threshold)
    w_coastal = WeatherContext(
        location_name="Mumbai APMC (Vashi)",
        latitude=19.07,
        longitude=72.99,
        temperature_max_c=38.0,
        is_coastal=True
    )
    assert engine.evaluate_weather(w_coastal).weather_risk_status == "RED"


def test_weather_unavailable_graceful_fallback():
    """When weather is unavailable or provider fails, no fake disruption is invented."""
    engine = WeatherEffectsEngine()
    
    w_down = WeatherContext(
        location_name="Nashik",
        latitude=19.99,
        longitude=73.78,
        is_available=False
    )
    impact = engine.evaluate_weather(w_down)
    assert impact.weather_risk_status == "GREEN"
    assert impact.weather_risk_score == 0.0
    assert impact.holding_loss_multiplier == 1.0
    assert impact.travel_time_multiplier == 1.0
    assert "unavailable" in impact.weather_risk_reason.lower()
