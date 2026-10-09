from pathlib import Path
import json
import warnings

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBRegressor

INPUT = Path("data/clean/krishinirnay_daily_model_series.csv")
REPORT = Path("reports/forecast/xgboost_walk_forward_comparison.csv")
PREDICTIONS = Path("reports/forecast/xgboost_walk_forward_predictions.csv")
SUMMARY = Path("reports/forecast/xgboost_walk_forward_summary.json")

HORIZONS = range(1, 8)
MIN_TRAIN_ROWS = 100

NUMERIC_FEATURES = [
    "price_current",
    "price_lag_1", "price_lag_2", "price_lag_3",
    "price_lag_7", "price_lag_14", "price_lag_28",
    "price_mean_3", "price_mean_7", "price_mean_14",
    "price_mean_28", "price_std_7",
    "arrivals_current", "arrivals_lag_1",
    "arrivals_lag_2", "arrivals_lag_7",
    "arrivals_mean_7",
    "target_day_of_week", "target_month",
    "target_day_of_year_sin", "target_day_of_year_cos",
]
CATEGORICAL_FEATURES = ["Market", "Commodity"]
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES

if not INPUT.exists():
    raise FileNotFoundError(f"Dataset not found: {INPUT}")

df = pd.read_csv(INPUT, low_memory=False)
df["Date"] = pd.to_datetime(df["Date"], errors="coerce").dt.normalize()
df["Market"] = df["Market"].astype(str).str.strip()
df["Commodity"] = df["Commodity"].astype(str).str.strip()

for col in ["Modal Price", "Arrivals"]:
    df[col] = pd.to_numeric(df[col], errors="coerce")

if df[["Date", "Market", "Commodity", "Modal Price", "Arrivals"]].isna().any().any():
    raise ValueError("Missing date, market, crop, price or arrivals found.")

if df.duplicated(["Date", "Market", "Commodity"]).any():
    raise ValueError("Duplicate daily keys found in the input dataset.")

unique_dates = sorted(pd.Timestamp(x) for x in df["Date"].unique())
cutoff_date = unique_dates[int(len(unique_dates) * 0.80)]

print("Chronological cutoff date:", cutoff_date.date())
print("Input rows:", len(df))
print("Forecast horizons:", list(HORIZONS))
print("Preparing lag and rolling features...")

series_data = {}

for (market, crop), part in df.groupby(["Market", "Commodity"], sort=True):
    part = part.sort_values("Date").reset_index(drop=True)

    dates = list(part["Date"])
    prices = part["Modal Price"].astype(float)
    arrivals = part["Arrivals"].astype(float)

    # Target values are indexed only by the exact observed date.
    price_by_date = dict(zip(dates, prices))

    feat = pd.DataFrame(index=part.index)

    # Observed price/arrivals on the forecast origin date are known.
    feat["price_current"] = prices
    feat["arrivals_current"] = arrivals

    for lag in [1, 2, 3, 7, 14, 28]:
        feat[f"price_lag_{lag}"] = prices.shift(lag)

    for window in [3, 7, 14, 28]:
        feat[f"price_mean_{window}"] = prices.rolling(
            window, min_periods=window
        ).mean()

    feat["price_std_7"] = prices.rolling(
        7, min_periods=7
    ).std(ddof=0)

    for lag in [1, 2, 7]:
        feat[f"arrivals_lag_{lag}"] = arrivals.shift(lag)

    feat["arrivals_mean_7"] = arrivals.rolling(
        7, min_periods=7
    ).mean()

    series_data[(market, crop)] = {
        "dates": dates,
        "prices": prices.to_numpy(dtype=float),
        "features": feat,
        "price_by_date": price_by_date,
    }

results = []
prediction_rows = []
horizon_summary = []

for horizon in HORIZONS:
    train_rows = []
    test_rows = []

    for (market, crop), series in series_data.items():
        dates = series["dates"]
        prices = series["prices"]
        feat = series["features"]
        price_by_date = series["price_by_date"]

        for i, origin_date in enumerate(dates):
            origin_date = pd.Timestamp(origin_date)
            target_date = origin_date + pd.Timedelta(days=int(horizon))

            # Evaluate only dates for which the source has an actual price.
            if target_date not in price_by_date:
                continue

            values = feat.iloc[i]
            if values.isna().any():
                continue

            target_day = target_date.dayofyear

            row = values.to_dict()
            row["Market"] = market
            row["Commodity"] = crop
            row["target_day_of_week"] = target_date.dayofweek
            row["target_month"] = target_date.month
            row["target_day_of_year_sin"] = np.sin(
                2 * np.pi * target_day / 365.25
            )
            row["target_day_of_year_cos"] = np.cos(
                2 * np.pi * target_day / 365.25
            )

            row["_actual"] = float(price_by_date[target_date])
            row["_origin_date"] = origin_date.date().isoformat()
            row["_target_date"] = target_date.date().isoformat()
            row["_last_baseline"] = float(prices[i])
            row["_ma7_baseline"] = float(values["price_mean_7"])

            if target_date < cutoff_date and origin_date < cutoff_date:
                train_rows.append(row)
            elif origin_date >= cutoff_date:
                test_rows.append(row)

    train = pd.DataFrame(train_rows)
    test = pd.DataFrame(test_rows)

    print(
        f"\nHorizon {horizon}: training rows={len(train)}, "
        f"test rows={len(test)}"
    )

    if len(train) < MIN_TRAIN_ROWS:
        print("Skipped: insufficient training rows.")
        continue

    if test.empty:
        print("Skipped: no eligible observed test targets.")
        continue

    y_train = train["_actual"].to_numpy(dtype=float)

    # One-hot encodings are fitted on training data only.
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore"),
                CATEGORICAL_FEATURES,
            )
        ],
        remainder="passthrough",
    )

    model = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", XGBRegressor(
            n_estimators=350,
            max_depth=4,
            learning_rate=0.035,
            subsample=0.9,
            colsample_bytree=0.9,
            reg_lambda=5.0,
            objective="reg:squarederror",
            eval_metric="mae",
            random_state=42,
            n_jobs=2,
            verbosity=0,
        )),
    ])

    model.fit(train[FEATURES], y_train)

    raw_predictions = model.predict(test[FEATURES])
    negative_prediction_count = int((raw_predictions < 0).sum())

    # Do not output negative prices.
    predictions = np.maximum(raw_predictions, 0.0)

    scored = test.copy()
    scored["_xgb_prediction"] = predictions
    scored["_xgb_negative_clipped"] = raw_predictions < 0
    scored["_horizon"] = horizon

    for (market, crop), part in scored.groupby(
        ["Market", "Commodity"], sort=True
    ):
        actual = part["_actual"].to_numpy(dtype=float)
        pred_xgb = part["_xgb_prediction"].to_numpy(dtype=float)
        pred_last = part["_last_baseline"].to_numpy(dtype=float)
        pred_ma7 = part["_ma7_baseline"].to_numpy(dtype=float)

        xgb_mae = float(mean_absolute_error(actual, pred_xgb))
        xgb_rmse = float(np.sqrt(mean_squared_error(actual, pred_xgb)))
        last_mae = float(mean_absolute_error(actual, pred_last))
        ma7_mae = float(mean_absolute_error(actual, pred_ma7))

        best_baseline_name = (
            "Last-observed" if last_mae <= ma7_mae
            else "Moving-average-7"
        )
        best_baseline_mae = min(last_mae, ma7_mae)

        improvement_pct = (
            100.0 * (best_baseline_mae - xgb_mae) / best_baseline_mae
            if best_baseline_mae > 0 else np.nan
        )

        winner = (
            "XGBoost" if xgb_mae < best_baseline_mae
            else best_baseline_name
        )

        results.append({
            "Market": market,
            "Commodity": crop,
            "Horizon_Days": horizon,
            "Test_Pairs": len(part),
            "XGBoost_MAE": xgb_mae,
            "XGBoost_RMSE": xgb_rmse,
            "Last_Observed_MAE": last_mae,
            "Moving_Average_7_MAE": ma7_mae,
            "Best_Baseline": best_baseline_name,
            "Best_Baseline_MAE": best_baseline_mae,
            "Improvement_vs_Best_Baseline_Pct": improvement_pct,
            "Winner_By_MAE": winner,
        })

        for _, item in part.iterrows():
            prediction_rows.append({
                "Market": item["Market"],
                "Commodity": item["Commodity"],
                "Horizon_Days": horizon,
                "Origin_Date": item["_origin_date"],
                "Target_Date": item["_target_date"],
                "Actual_Price_INR_per_Qtl": item["_actual"],
                "XGBoost_Prediction_INR_per_Qtl": item["_xgb_prediction"],
                "Last_Observed_Prediction_INR_per_Qtl": item["_last_baseline"],
                "Moving_Average_7_Prediction_INR_per_Qtl": item["_ma7_baseline"],
            })

    horizon_summary.append({
        "horizon_days": horizon,
        "training_rows": len(train),
        "test_rows": len(test),
        "negative_predictions_clipped": negative_prediction_count,
    })

REPORT.parent.mkdir(parents=True, exist_ok=True)

results_df = pd.DataFrame(results)
predictions_df = pd.DataFrame(prediction_rows)

if results_df.empty:
    raise RuntimeError("No model metrics produced; no report was written.")

results_df.to_csv(REPORT, index=False, encoding="utf-8-sig")
predictions_df.to_csv(PREDICTIONS, index=False, encoding="utf-8-sig")

summary = {
    "project": "KrishiNirnay",
    "model_status": "candidate_not_promoted",
    "input_file": INPUT.as_posix(),
    "forecast_horizons_days": list(HORIZONS),
    "cutoff_date": cutoff_date.date().isoformat(),
    "target": (
        "Daily observed modal-price proxy, including the documented "
        "arrival-weighted variety aggregation for multi-variety days."
    ),
    "evaluation": (
        "Chronological walk-forward evaluation. Model fitted using "
        "training targets before cutoff; test origins start at cutoff. "
        "Scores use exact source-observed target dates only."
    ),
    "features": NUMERIC_FEATURES,
    "categorical_features": CATEGORICAL_FEATURES,
    "horizon_training_summary": horizon_summary,
    "winner_counts": results_df["Winner_By_MAE"].value_counts().to_dict(),
    "xgboost_wins": int((results_df["Winner_By_MAE"] == "XGBoost").sum()),
    "series_horizon_comparisons": int(len(results_df)),
    "metrics_file": REPORT.as_posix(),
    "predictions_file": PREDICTIONS.as_posix(),
}

with SUMMARY.open("w", encoding="utf-8") as file:
    json.dump(summary, file, indent=2, ensure_ascii=False)

print("\n" + "=" * 100)
print("XGBOOST WALK-FORWARD COMPARISON")
print("=" * 100)

display_cols = [
    "Market", "Commodity", "Horizon_Days", "Test_Pairs",
    "XGBoost_MAE", "Last_Observed_MAE",
    "Moving_Average_7_MAE", "Improvement_vs_Best_Baseline_Pct",
    "Winner_By_MAE",
]
print(results_df[display_cols].round(2).to_string(index=False))

print("\nWINNER COUNTS")
print(results_df["Winner_By_MAE"].value_counts().to_string())
print("\nSaved report:", REPORT.resolve())
print("Saved predictions:", PREDICTIONS.resolve())
print("Saved summary:", SUMMARY.resolve())
print("\nCandidate models have not been promoted or saved as production models.")
print("Input dataset was not modified.")
