"""
services/decision/__init__.py

KrishiNirnay — Division 2: Decision, Risk & Economics Engine
Project Tagline: "Sahi Bhav Se, Samriddhi Ki Raah Pe"
Authority: SYRUS_PS02_MASTER.md & SYRUS_PS02_DIVISION_2_DECISION_RISK_ENGINE.md
"""

from .net_return import (
    calculate_net_return,
    normalize_quantity_to_qtl,
    compute_holding_loss_sequential,
    compute_travel_loss_sequential,
    calculate_storage_cost,
    calculate_financing_cost,
    NetReturnBreakdown,
    UnitConversionError
)
from .route_cost import (
    RouteCostEngine,
    RouteInfo,
    TransportCostBreakdown,
    DEFAULT_MANDI_COORDINATES
)
from .weather_effects import (
    WeatherContext,
    WeatherEconomicImpact,
    WeatherEffectsEngine
)
from .risk_engine import (
    SixRiskEngine,
    RiskAssessment,
    RiskFlag
)
from .reservation_price import (
    calculate_reservation_price,
    ReservationPriceResult
)
from .explanation_rules import (
    generate_explanation,
    ExplanationPayload
)
from .decision_record import (
    DecisionRecord,
    BaselineRecord,
    ChosenRecord,
    CandidateEvaluation,
    AssumptionRecord,
    SourceRefRecord
)
from .decision_policy import (
    DecisionEngine,
    DecisionRequest,
    MarketSnapshotInput,
    ForecastTargetInput
)
from .scenario_engine import (
    ScenarioEngine,
    ScenarioParameters,
    ScenarioResult,
    ScenarioDifference
)

__all__ = [
    "calculate_net_return",
    "normalize_quantity_to_qtl",
    "compute_holding_loss_sequential",
    "compute_travel_loss_sequential",
    "calculate_storage_cost",
    "calculate_financing_cost",
    "NetReturnBreakdown",
    "UnitConversionError",
    "RouteCostEngine",
    "RouteInfo",
    "TransportCostBreakdown",
    "DEFAULT_MANDI_COORDINATES",
    "WeatherContext",
    "WeatherEconomicImpact",
    "WeatherEffectsEngine",
    "SixRiskEngine",
    "RiskAssessment",
    "RiskFlag",
    "calculate_reservation_price",
    "ReservationPriceResult",
    "generate_explanation",
    "ExplanationPayload",
    "DecisionRecord",
    "BaselineRecord",
    "ChosenRecord",
    "CandidateEvaluation",
    "AssumptionRecord",
    "SourceRefRecord",
    "DecisionEngine",
    "DecisionRequest",
    "MarketSnapshotInput",
    "ForecastTargetInput",
    "ScenarioEngine",
    "ScenarioParameters",
    "ScenarioResult",
    "ScenarioDifference"
]
