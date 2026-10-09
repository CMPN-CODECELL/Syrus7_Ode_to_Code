from pathlib import Path
import numpy as np
import pandas as pd

INPUT = Path("data/clean/krishinirnay_daily_model_series.csv")
OUTPUT = Path("reports/forecast/baseline_backtest.csv")
HORIZONS = range(1, 8)
WINDOW = 7

if not INPUT.exists():
    raise FileNotFoundError(f"Dataset not found: {INPUT}")

df = pd.read_csv(INPUT, low_memory=False)
required = {"Date", "Market", "Commodity", "Modal Price"}

if not required.issubset(df.columns):
    raise ValueError(f"Missing columns: {required - set(df.columns)}")

df["Date"] = pd.to_datetime(df["Date"], errors="coerce").dt.normalize()
df["Modal Price"] = pd.to_numeric(df["Modal Price"], errors="coerce")

if df[["Date", "Market", "Commodity", "Modal Price"]].isna().any().any():
    raise ValueError("Missing date, market, crop, or modal price found.")

if (df["Modal Price"] < 0).any():
    raise ValueError("Negative prices found.")

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
results = []

for (market, crop), part in df.groupby(["Market", "Commodity"], sort=True):
    part = part.sort_values("Date").reset_index(drop=True)

    if part["Date"].duplicated().any():
        raise ValueError(f"Duplicate daily dates found: {market}, {crop}")

    dates = part["Date"]
    prices = part["Modal Price"].to_numpy(dtype=float)
    date_to_index = {
        pd.Timestamp(date): idx
        for idx, date in enumerate(dates)
    }

    # Reserve the final 20% of dates for evaluation.
    cutoff_idx = int(len(part) * 0.80)
    cutoff_date = pd.Timestamp(dates.iloc[cutoff_idx])

    training_prices = prices[:cutoff_idx]
    scale = (
        float(np.abs(np.diff(training_prices)).mean())
        if len(training_prices) > 1 else np.nan
    )

    for horizon in HORIZONS:
        actuals = []
        last_predictions = []
        average_predictions = []

        for origin_idx in range(WINDOW - 1, len(part)):
            origin_date = pd.Timestamp(dates.iloc[origin_idx])
            target_date = origin_date + pd.Timedelta(days=horizon)

            # Score only exact observed target dates.
            target_idx = date_to_index.get(target_date)
            if target_idx is None or target_date < cutoff_date:
                continue

            history = prices[max(0, origin_idx - WINDOW + 1):origin_idx + 1]

            actuals.append(prices[target_idx])
            last_predictions.append(prices[origin_idx])
            average_predictions.append(float(history.mean()))

        if not actuals:
            results.append({
                "Market": market,
                "Commodity": crop,
                "Horizon_Days": horizon,
                "Test_Pairs": 0,
                "Last_Observed_MAE": np.nan,
                "Last_Observed_RMSE": np.nan,
                "Last_Observed_MASE": np.nan,
                "Moving_Average_7_MAE": np.nan,
                "Moving_Average_7_RMSE": np.nan,
                "Moving_Average_7_MASE": np.nan,
                "Winner_By_MAE": "Insufficient test pairs",
            })
            continue

        y = np.asarray(actuals)
        pred_last = np.asarray(last_predictions)
        pred_avg = np.asarray(average_predictions)

        mae_last = float(np.mean(np.abs(y - pred_last)))
        rmse_last = float(np.sqrt(np.mean((y - pred_last) ** 2)))
        mae_avg = float(np.mean(np.abs(y - pred_avg)))
        rmse_avg = float(np.sqrt(np.mean((y - pred_avg) ** 2)))

        mase_last = mae_last / scale if scale > 0 else np.nan
        mase_avg = mae_avg / scale if scale > 0 else np.nan

        if np.isclose(mae_last, mae_avg):
            winner = "Tie"
        elif mae_last < mae_avg:
            winner = "Last-observed"
        else:
            winner = "Moving-average-7"

        results.append({
            "Market": market,
            "Commodity": crop,
            "Horizon_Days": horizon,
            "Test_Pairs": len(y),
            "Last_Observed_MAE": mae_last,
            "Last_Observed_RMSE": rmse_last,
            "Last_Observed_MASE": mase_last,
            "Moving_Average_7_MAE": mae_avg,
            "Moving_Average_7_RMSE": rmse_avg,
            "Moving_Average_7_MASE": mase_avg,
            "Winner_By_MAE": winner,
        })

result = pd.DataFrame(results)
result.to_csv(OUTPUT, index=False, encoding="utf-8-sig")

display_cols = [
    "Market", "Commodity", "Horizon_Days", "Test_Pairs",
    "Last_Observed_MAE", "Moving_Average_7_MAE", "Winner_By_MAE"
]

print("=" * 85)
print("BASELINE BACKTEST SUMMARY")
print("=" * 85)
print(result[display_cols].round(2).to_string(index=False))
print("\nBaseline wins:")
print(result["Winner_By_MAE"].value_counts().to_string())
print("\nSaved report:", OUTPUT.resolve())
print("Input dataset was not modified.")
