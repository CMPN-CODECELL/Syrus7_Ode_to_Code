"""Canonical DecisionRecord schema definition for KrishiNirnay.
Single source of truth shared across all layers.
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

class CostBreakdown(BaseModel):
    gross_revenue: float = Field(..., description="Gross revenue before deductions (INR)")
    transport: float = Field(..., description="Transport cost including round trip & trips (INR)")
    hamali_tolai: float = Field(..., description="Hamali/weighment labor fees (INR)")
    commission_fees: float = Field(0.0, description="Market commission and APMC cess (INR)")
    storage: float = Field(0.0, description="Holding storage cost (INR)")
    financing: float = Field(0.0, description="Financing cost of tied capital (INR)")
    travel_loss_pct: float = Field(0.0, description="Perishability transit loss percentage (e.g. 0.01 for 1%)")
    holding_loss_pct: float = Field(0.0, description="Perishability holding loss percentage (e.g. 0.02 for 2%)")
    quality_factor: float = Field(1.0, description="Quality multiplier (1.0 = standard grade)")
    quantity_initial_qtl: float = Field(..., description="Initial lot quantity in quintals")
    quantity_sold_qtl: float = Field(..., description="Net saleable quantity in quintals after sequential losses")
    final_net: float = Field(..., description="Final net realization (INR)")

class BaselineOutcome(BaseModel):
    market: str = Field(..., description="Home baseline mandi name")
    sale_day: str = Field(..., description="Sale date (YYYY-MM-DD)")
    modal_price: float = Field(..., description="Observed modal price in INR/qtl")
    quantity_sold_qtl: float = Field(..., description="Net sold quantity in qtl")
    gross_revenue: float = Field(..., description="Gross revenue in INR")
    net_total: float = Field(..., description="Net baseline realization in INR")
    cost_breakdown: CostBreakdown

class ChosenOutcome(BaseModel):
    action: Literal["SELL_NOW", "WAIT", "GO"] = Field(..., description="Recommended action")
    market: str = Field(..., description="Selected mandi name")
    sale_day: str = Field(..., description="Recommended sale date (YYYY-MM-DD)")
    wait_days: int = Field(0, description="Number of days to wait from today")
    modal_price_expected: float = Field(..., description="Expected/forecasted modal price in INR/qtl")
    net_total: float = Field(..., description="Risk-adjusted net realization in INR")
    gain_total: float = Field(..., description="Net gain over baseline in INR")
    gain_pct: float = Field(..., description="Net gain percentage over baseline")
    probability_beat_baseline: float = Field(..., description="Probability of beating baseline net (0.0 to 1.0)")
    reservation_price: float = Field(..., description="Break-even / reservation price per quintal in INR/qtl")
    cost_breakdown: CostBreakdown

class ForecastPayload(BaseModel):
    crop: str
    mandi: str
    target_date: str
    q10: float
    q20: float
    q35: float
    q50: float
    q90: float
    low: float
    expected: float
    high: float
    reliability: Literal["HIGH", "MEDIUM", "LOW"]
    rolling_mase: float
    rolling_80_coverage: float
    training_end_date: str
    out_of_range: bool = False
    top_drivers_up: List[str] = Field(default_factory=list)
    top_drivers_down: List[str] = Field(default_factory=list)
    unit: str = "INR_PER_QUINTAL"

class RiskFlag(BaseModel):
    id: str = Field(..., description="Flag identifier, e.g. price_drop, weather")
    name: str = Field(..., description="Human readable flag title")
    status: Literal["GREEN", "YELLOW", "RED"]
    score: float = Field(..., description="0.0 for Green, 0.5 for Yellow, 1.0 for Red")
    reason: str = Field(..., description="Explanation of flag state")
    evidence: str = Field(..., description="Underlying metric or data evidence")

class RiskPayload(BaseModel):
    overall: Literal["GREEN", "YELLOW", "RED"]
    score: float = Field(..., description="Weighted composite risk score [0, 1]")
    flags: List[RiskFlag]
    safety_override: Optional[str] = None

class ExplanationPayload(BaseModel):
    verdict: str
    why: List[str] = Field(default_factory=list)
    key_drivers: List[str] = Field(default_factory=list)
    evidence: List[str] = Field(default_factory=list)
    spoken_summary: str = Field(..., description="Short 3-part spoken text: verdict, net amount, main risk")

class DecisionRecord(BaseModel):
    request_id: str
    engine_version: str = "1.0.0"
    data_snapshot_id: str = "snapshot_v1_live"
    rules_version: str = "rules_v1.0"
    forecast_model_version: str = "xgboost_direct_h7_v1"
    calibration_version: str = "conformal_residual_v1"
    cost_config_version: str = "cost_v1.0"
    weather_snapshot_id: str = "weather_openmeteo_v1"
    route_snapshot_id: str = "route_ors_v1"
    timestamp: str
    commodity: str
    lot_quantity_qtl: float
    risk_profile: Literal["CAUTIOUS", "BALANCED", "AGGRESSIVE"] = "BALANCED"
    baseline: BaselineOutcome
    chosen: ChosenOutcome
    forecast: ForecastPayload
    risk: RiskPayload
    warnings: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    source_refs: List[str] = Field(default_factory=list)
    explanation: ExplanationPayload
