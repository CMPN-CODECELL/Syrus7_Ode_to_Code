"""Model Validation and Fair Baseline Comparison Routes for KrishiNirnay.

Provides reproducible metrics comparing XGBoost against Last-Observed and
Moving-Average baselines using strictly chronological walk-forward evaluation.
"""

from pathlib import Path
import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np

router = APIRouter(prefix="/api/model-validation", tags=["Model Validation"])

PROJECT_ROOT = Path(__file__).resolve().parents[3]
SUMMARY_FILE = PROJECT_ROOT / "reports" / "forecast" / "xgboost_walk_forward_summary.json"
COMPARISON_FILE = PROJECT_ROOT / "reports" / "forecast" / "xgboost_walk_forward_comparison.csv"
PREDICTIONS_FILE = PROJECT_ROOT / "reports" / "forecast" / "xgboost_walk_forward_predictions.csv"

class ModelComparisonRow(BaseModel):
    market: str
    commodity: str
    horizon_days: int
    test_pairs: int
    xgboost_mae: float
    xgboost_rmse: float
    last_observed_mae: float
    moving_average_7_mae: float
    best_baseline: str
    best_baseline_mae: float
    improvement_vs_baseline_pct: float
    winner: str

class ValidationSummaryResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    project: str
    model_status: str
    model_status_label_en: str
    model_status_label_mr: str
    target_variable: str
    target_variable_mr: str
    units: str
    dataset_file: str
    total_records: int
    cutoff_date: str
    evaluation_method: str
    evaluation_method_mr: str
    total_test_pairs: int
    horizons_evaluated: List[int]
    features_count: int
    features_list: List[str]
    winner_counts: Dict[str, int]
    comparisons: List[ModelComparisonRow]
    overall_avg_xgboost_mae: float
    overall_avg_baseline_mae: float

class PredictionDataPoint(BaseModel):
    origin_date: str
    target_date: str
    actual_price: float
    xgboost_price: float
    last_observed_price: float
    moving_average_price: float
    xgb_residual: float
    baseline_residual: float

class SeriesValidationResponse(BaseModel):
    market: str
    commodity: str
    horizon_days: int
    test_pairs: int
    xgboost_mae: float
    xgboost_rmse: float
    last_observed_mae: float
    moving_average_7_mae: float
    best_baseline: str
    winner: str
    improvement_pct: float
    predictions: List[PredictionDataPoint]
    residual_stats: Dict[str, Any]

def _normalize_market_name(m: str) -> str:
    cleaned = m.strip()
    if cleaned == "APMC Nasik" or cleaned == "Nashik":
        return "Nashik APMC"
    if cleaned == "APMC Pimpalgaon Baswant" or cleaned == "Pimpalgaon Baswant":
        return "Pimpalgaon Baswant APMC"
    if cleaned == "APMC Sangamner" or cleaned == "Sangamner":
        return "Sangamner APMC"
    return cleaned

@router.get("/summary", response_model=ValidationSummaryResponse)
def get_validation_summary():
    """Returns the comprehensive walk-forward evaluation summary across all 42 series-horizons."""
    if not COMPARISON_FILE.exists() or not SUMMARY_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="Evaluation artifacts not found. Please ensure reports/forecast/ exists."
        )

    with open(SUMMARY_FILE, "r", encoding="utf-8") as f:
        meta = json.load(f)

    df = pd.read_csv(COMPARISON_FILE)
    
    comparisons: List[ModelComparisonRow] = []
    for _, r in df.iterrows():
        market_std = _normalize_market_name(str(r["Market"]))
        comparisons.append(ModelComparisonRow(
            market=market_std,
            commodity=str(r["Commodity"]),
            horizon_days=int(r["Horizon_Days"]),
            test_pairs=int(r["Test_Pairs"]),
            xgboost_mae=round(float(r["XGBoost_MAE"]), 1),
            xgboost_rmse=round(float(r["XGBoost_RMSE"]), 1),
            last_observed_mae=round(float(r["Last_Observed_MAE"]), 1),
            moving_average_7_mae=round(float(r["Moving_Average_7_MAE"]), 1),
            best_baseline=str(r["Best_Baseline"]),
            best_baseline_mae=round(float(r["Best_Baseline_MAE"]), 1),
            improvement_vs_baseline_pct=round(float(r["Improvement_vs_Best_Baseline_Pct"]), 2),
            winner=str(r["Winner_By_MAE"])
        ))

    overall_xgb_mae = round(float(df["XGBoost_MAE"].mean()), 1)
    overall_base_mae = round(float(df["Best_Baseline_MAE"].mean()), 1)

    return ValidationSummaryResponse(
        project="KrishiNirnay",
        model_status=meta.get("model_status", "candidate_not_promoted"),
        model_status_label_en="Candidate Evaluated • Point Model Not Blindly Promoted • Conformal Risk Intervals Deployed",
        model_status_label_mr="मूल्यांकन पूर्ण • केवळ एका भावावर विसंबून न राहता कॉन्फॉर्मल जोखीम कक्षा तैनात",
        target_variable="Daily observed modal-price proxy (INR / Quintal)",
        target_variable_mr="दैनिक बाजार समिती सरासरी भाव (रुपये प्रति क्विंटल)",
        units="INR/qtl (₹/क्विंटल)",
        dataset_file="data/clean/krishinirnay_daily_model_series.csv",
        total_records=10950,
        cutoff_date=meta.get("cutoff_date", "2026-04-22"),
        evaluation_method="Chronological walk-forward test (80% historical train / 20% held-out forward test). No future lookahead leakage.",
        evaluation_method_mr="कालक्रमानुसार पुढे जाणारी चाचणी (८०% ऐतिहासिक प्रशिक्षण / २०% स्वतंत्र चाचणी). भविष्यातील माहितीची कोणतीही गळती नाही.",
        total_test_pairs=int(df["Test_Pairs"].sum()),
        horizons_evaluated=meta.get("forecast_horizons_days", [1, 2, 3, 4, 5, 6, 7]),
        features_count=len(meta.get("features", [])) + len(meta.get("categorical_features", [])),
        features_list=meta.get("features", []),
        winner_counts=meta.get("winner_counts", {}),
        comparisons=comparisons,
        overall_avg_xgboost_mae=overall_xgb_mae,
        overall_avg_baseline_mae=overall_base_mae
    )

@router.get("/series", response_model=SeriesValidationResponse)
def get_series_validation(
    mandi: str = Query("Nashik APMC", description="Mandi name"),
    crop: str = Query("Tomato", description="Commodity name"),
    horizon: int = Query(1, ge=1, le=7, description="Forecast horizon days (1-7)")
):
    """Returns actual vs predicted points and error residuals for a specific mandi, crop, and horizon."""
    if not PREDICTIONS_FILE.exists() or not COMPARISON_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="Predictions file not found."
        )

    comp_df = pd.read_csv(COMPARISON_FILE)
    
    # Filter matching series
    def match_mandi(row_val: str, target: str) -> bool:
        return _normalize_market_name(row_val).lower() == _normalize_market_name(target).lower()

    row_match = comp_df[
        comp_df["Market"].apply(lambda x: match_mandi(str(x), mandi)) &
        (comp_df["Commodity"].str.lower() == crop.lower()) &
        (comp_df["Horizon_Days"] == horizon)
    ]

    if row_match.empty:
        # Fallback to APMC Nasik Tomato Horizon 1
        row_match = comp_df[
            (comp_df["Commodity"] == "Tomato") &
            (comp_df["Horizon_Days"] == horizon)
        ].iloc[0:1]

    r = row_match.iloc[0]

    # Load actual predictions
    preds_df = pd.read_csv(PREDICTIONS_FILE)
    preds_match = preds_df[
        preds_df["Market"].apply(lambda x: match_mandi(str(x), mandi)) &
        (preds_df["Commodity"].str.lower() == crop.lower()) &
        (preds_df["Horizon_Days"] == horizon)
    ]

    if preds_match.empty:
        preds_match = preds_df[
            (preds_df["Commodity"] == "Tomato") &
            (preds_df["Horizon_Days"] == horizon)
        ]

    # Select the most recent 60 test points for clean visualization
    sample = preds_match.tail(60)

    points: List[PredictionDataPoint] = []
    xgb_errors = []
    base_errors = []

    for _, row in sample.iterrows():
        act = float(row["Actual_Price_INR_per_Qtl"])
        xgb_p = float(row["XGBoost_Prediction_INR_per_Qtl"])
        last_p = float(row["Last_Observed_Prediction_INR_per_Qtl"])
        ma7_p = float(row["Moving_Average_7_Prediction_INR_per_Qtl"])

        xgb_err = round(act - xgb_p, 1)
        base_err = round(act - last_p, 1)

        xgb_errors.append(abs(xgb_err))
        base_errors.append(abs(base_err))

        points.append(PredictionDataPoint(
            origin_date=str(row["Origin_Date"]),
            target_date=str(row["Target_Date"]),
            actual_price=round(act, 1),
            xgboost_price=round(xgb_p, 1),
            last_observed_price=round(last_p, 1),
            moving_average_price=round(ma7_p, 1),
            xgb_residual=xgb_err,
            baseline_residual=base_err
        ))

    residual_stats = {
        "xgb_errors_within_100_inr_pct": round(float(np.mean(np.array(xgb_errors) <= 100.0) * 100), 1),
        "xgb_errors_within_200_inr_pct": round(float(np.mean(np.array(xgb_errors) <= 200.0) * 100), 1),
        "base_errors_within_100_inr_pct": round(float(np.mean(np.array(base_errors) <= 100.0) * 100), 1),
        "base_errors_within_200_inr_pct": round(float(np.mean(np.array(base_errors) <= 200.0) * 100), 1),
        "max_xgb_error": round(float(max(xgb_errors) if xgb_errors else 0), 1),
        "max_base_error": round(float(max(base_errors) if base_errors else 0), 1),
    }

    return SeriesValidationResponse(
        market=_normalize_market_name(str(r["Market"])),
        commodity=str(r["Commodity"]),
        horizon_days=int(r["Horizon_Days"]),
        test_pairs=len(points),
        xgboost_mae=round(float(r["XGBoost_MAE"]), 1),
        xgboost_rmse=round(float(r["XGBoost_RMSE"]), 1),
        last_observed_mae=round(float(r["Last_Observed_MAE"]), 1),
        moving_average_7_mae=round(float(r["Moving_Average_7_MAE"]), 1),
        best_baseline=str(r["Best_Baseline"]),
        winner=str(r["Winner_By_MAE"]),
        improvement_pct=round(float(r["Improvement_vs_Best_Baseline_Pct"]), 2),
        predictions=points,
        residual_stats=residual_stats
    )
