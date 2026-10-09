"""
services/decision/decision_record.py

Immutable DecisionRecord Models & Contracts for KrishiNirnay.
Project Tagline: "Sahi Bhav Se, Samriddhi Ki Raah Pe"
Authority: SYRUS_PS02_MASTER.md (Sections 16, 27) & SYRUS_PS02_DIVISION_2_DECISION_RISK_ENGINE.md (Section 27)

The DecisionRecord is the SINGLE SOURCE OF NUMERICAL TRUTH.
Every screen in the dashboard, API response, chat response, and spoken audio
must be derived strictly from this immutable structured record.
"""

from __future__ import annotations

from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

from .risk_engine import RiskAssessment
from .explanation_rules import ExplanationPayload


class AssumptionRecord(BaseModel):
    """Explicit inspection metadata for an economic or physical parameter."""
    param: str
    value: Any
    status: Literal["VERIFIED", "ASSUMPTION"]
    source: Optional[str] = None
    last_verified: Optional[str] = None


class SourceRefRecord(BaseModel):
    """Audit reference to upstream data sources."""
    type: str # "market_snapshot", "forecast", "weather", "route"
    source: str # e.g. "data.gov.in", "open_meteo", "ors"
    ref: str
    fetched_at: Optional[str] = None


class CostBreakdown(BaseModel):
    """Detailed logistics and perishability cost breakdown."""
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


class BaselineRecord(BaseModel):
    """The baseline action: sell at home mandi today."""
    market: str
    sale_day: str
    net_total: float
    gross_revenue: float
    quantity_sold_qtl: float
    price_inr_per_qtl: float
    modal_price: Optional[float] = None
    costs: Dict[str, float]
    cost_breakdown: Optional[CostBreakdown] = None


class ChosenRecord(BaseModel):
    """The winning recommendation that passed all safety and economic gates."""
    action: Literal["SELL_NOW", "WAIT", "GO", "INSUFFICIENT_EVIDENCE"]
    market: str
    sale_day: str
    net_total: float
    gain_total: float
    gain_pct: float
    probability_beat_baseline: Optional[float] = None
    reservation_price: Optional[float] = None
    required_gain_pct: float
    quantity_sold_qtl: float
    holding_days: int
    wait_days: Optional[int] = None
    modal_price_expected: Optional[float] = None
    costs: Dict[str, float]
    cost_breakdown: Optional[CostBreakdown] = None


class CandidateEvaluation(BaseModel):
    """Evaluated option across mandi x day horizon for the 3x7 heatmap."""
    market: str
    sale_day: str
    holding_days: int
    price_inr_per_qtl: float
    quantile_used: str
    net_total: float
    gain_pct: float
    probability_beat_baseline: Optional[float] = None
    reservation_price: Optional[float] = None
    is_open: bool
    is_feasible: bool
    is_safe: bool
    disqualification_reason: Optional[str] = None
    costs: Dict[str, float]
    breakdown: Dict[str, Any]


class DecisionRecord(BaseModel):
    """
    Immutable DecisionRecord: Single Source of Truth for KrishiNirnay.
    """
    request_id: str = Field(..., description="Unique request UUID")
    engine_version: str = Field("1.0.0", description="Decision engine software version")
    data_snapshot_id: str = Field(..., description="ID/Hash of market data snapshot")
    rules_version: str = Field("1.0.0", description="Version of risk and gate rules")
    forecast_model_version: str = Field("1.0.0", description="Version of predictive model")
    calibration_version: str = Field("1.0.0", description="Version of conformal calibration")
    cost_config_version: str = Field("1.0.0", description="Version of cost configuration file")
    weather_snapshot_id: str = Field("weather-snap-v1", description="ID of weather context snapshot")
    route_snapshot_id: str = Field("route-snap-v1", description="ID of routing context snapshot")
    timestamp: str = Field(..., description="ISO-8601 generation timestamp")

    commodity: str = Field("Tomato", description="Commodity name")
    lot_quantity_qtl: float = Field(20.0, description="Lot quantity in quintals")
    risk_profile: str = Field("BALANCED", description="Risk profile")

    baseline: BaselineRecord = Field(..., description="Home mandi sell-today baseline")
    chosen: ChosenRecord = Field(..., description="Selected policy recommendation")
    forecast: Dict[str, Any] = Field(default_factory=dict, description="Forecast summary")
    risk: RiskAssessment = Field(..., description="Six-risk assessment")
    warnings: List[str] = Field(default_factory=list, description="Operational and quality warnings")
    assumptions: List[AssumptionRecord] = Field(default_factory=list, description="Inspectable parameter assumptions")
    source_refs: List[SourceRefRecord] = Field(default_factory=list, description="Data provenance references")
    explanation: ExplanationPayload = Field(..., description="Deterministic explanation and Why cards")
    candidates: List[CandidateEvaluation] = Field(default_factory=list, description="All evaluated candidate cells (3x7 grid)")
    hysteresis_applied: bool = Field(False, description="True if recommendation flip was suppressed by hysteresis")

    model_config = ConfigDict(frozen=True)
