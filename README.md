<div align="center">

# 🌾 KrishiNirnay (कृषिनिर्णय)
### *“Sahi Bhav Se, Samriddhi Ki Raah Pe” — Turning Distress Selling into Data-Backed Prosperity*

[![Syrus 7.0](https://img.shields.io/badge/Syrus%207.0-Agriculture%20PS__02-2E7D32.svg?style=for-the-badge)](https://github.com/Parth-Chavan-15/Syrus7_Ode_to_Code)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%20%7C%203.11-3776AB.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![Tests Passing](https://img.shields.io/badge/Tests-72%2F72%20Passed-brightgreen.svg?style=for-the-badge&logo=pytest&logoColor=white)](#step-3-verify-installation--run-tests)
[![Localization](https://img.shields.io/badge/Language-मराठी%20%7C%20English-FF9933.svg?style=for-the-badge)](#-3-interactive-platform-experience)

**An economic decision, risk intelligence, and spatial price arbitrage platform helping smallholder farmers decide *when* and *where* to sell for maximum take-home profit.**

[The Problem](#-1-the-problem-why-farmers-lose-money) • [Worked Example](#-2-real-world-walkthrough-how-it-saves-money) • [Platform Features](#-3-interactive-platform-experience) • [How It Works](#-4-how-the-engine-works) • [Architecture](#-5-system-architecture--tech-stack) • [Quick Start](#-6-quick-start--running-locally)

---

### 🖥️ Interactive Farmer Decision Dashboard

<img src="docs/assets/dashboard_preview.png" alt="KrishiNirnay Real-Time Farmer Decision Dashboard" width="100%" />

*Live dashboard displaying commodity inputs, Taluka road-route geocoding (Nashik 60 km), round-trip freight modeling, storage selection, live APMC streaming ticks, and the Krishi Mitra AI Copilot.*

</div>

---

## 📌 Table of Contents
- [1. The Problem: Why Farmers Lose Money](#-1-the-problem-why-farmers-lose-money)
- [2. Real-World Walkthrough: How It Saves Money](#-2-real-world-walkthrough-how-it-saves-money)
- [3. Interactive Platform Experience](#-3-interactive-platform-experience)
- [4. How the Engine Works](#-4-how-the-engine-works)
- [5. System Architecture & Tech Stack](#-5-system-architecture--tech-stack)
- [6. Quick Start & Running Locally](#-6-quick-start--running-locally)
- [7. Repository Structure](#-7-repository-structure)
- [8. Audit Documentation & Team](#-8-audit-documentation--team)

---

## 🚨 1. The Problem: Why Farmers Lose Money

Over **86% of Indian farmers are small and marginal**, frequently forced into post-harvest **distress selling**—offloading freshly harvested crops immediately at local lows due to liquidity pressure, storage fears, and opaque mandi pricing.

> *“I have 20 quintals of harvested tomatoes in Niphad. Should I sell today at Nashik APMC for ₹1,800/qtl, or wait 2 days and sell when prices are expected to rise?”*

Most agricultural apps only display raw daily mandi prices. In reality, **a higher sticker price does not guarantee higher take-home cash**. Every decision involves hidden trade-offs:
- **Sequential Spoilage:** Perishables shrink every day in storage and during bumpy road transit.
- **True Logistics Friction:** Round-trip vehicle costs (pickup vs. truck), distance, *hamali* (labour), and *tolai* (weighing charges).
- **Capital Financing Cost:** Waiting ties up cash that could pay off immediate farm credit.
- **Downside Risk:** Weather alerts or sudden mandi arrival spikes can crash tomorrow's rate.

**KrishiNirnay calculates the farmer's exact Net In-Hand Realization after every expense and risk factor—delivering a clear verdict: Sell Now, Wait, or Travel to another mandi.**

---

## 💡 2. Real-World Walkthrough: How It Saves Money

Consider a verified real-world scenario built into KrishiNirnay: **20 quintals of Tomato in Nashik APMC** (current rate **₹1,800/qtl**, 60 km transport at ₹12/km round trip, ₹12/qtl *hamali/tolai*, 12% annual financing rate):

| Decision Option | Gross & Spoilage Flow | Total Expenses Deducted | Net Cash in Hand |
| :--- | :--- | :--- | :--- |
| **Sell Today (Baseline)** | `20.00 qtl` sold @ `₹1,800/qtl` = ₹36,000 *(minus 1% transit / handling)* | **₹1,440** transport + **₹240** *hamali* | **₹33,960** |
| **Wait 2 Days (Recommended)** | Spoilage reduces lot sequentially (`20.0` $\rightarrow$ `19.6` $\rightarrow$ `19.404 qtl`) @ `₹1,950/qtl` | Transport + *hamali* + storage + capital interest | **₹36,055** |

### 🎯 The Actionable Output for the Farmer:
- **Optimal Action:** `WAIT 2 DAYS`
- **Extra Profit in Pocket:** **+₹2,095** *(+6.17% above selling today)*
- **Break-Even Reservation Price:** **~₹1,842 / qtl** — *“Do not accept below ₹1,842/qtl at the mandi; otherwise holding does not pay off.”*
- **Win Confidence:** **62.4%** probability of beating today's baseline net payout.

---

## 📱 3. Interactive Platform Experience

KrishiNirnay offers a responsive, accessibility-first interface built for both desktop and rural mobile users:

| Feature / Tab | What It Does for the Farmer & Reviewer |
| :--- | :--- |
| **📈 Market Advice** | Instant **Sell Now vs. Wait vs. Go** verdict, 3-mandi spatial price comparison (Nashik, Pimpalgaon Baswant, Sangamner), 7-day forecast curve, and live IMD weather alerts. |
| **🧪 What-If Planner** | Interactive stress-testing sliders to simulate market shocks (e.g., *-10% price crash*, *+20% diesel cost*, *2x mandi arrivals*) without mutating historical records. |
| **💰 Expense Bill** | Line-by-line transparent receipt separating gross revenue, sequential spoilage loss, round-trip freight, *hamali/tolai*, storage rental, and capital financing cost. |
| **🌾 My Farm & Localization** | 1-tap switching between **मराठी (Marathi)** and **English**, Taluka catchment geocoding, storage type selection (Open Shed, Crates, Cold Storage), and live WebSocket mandi ticker. |
| **🤖 Krishi Mitra AI Copilot** | Bilingual voice & chat assistant with progressive slot-filling (asks for missing Crop, Quantity, or Mandi instead of guessing) backed by the **Zero-Hallucination Number Guard**. |
| **📊 Judge Tools** | Dedicated inspection panel displaying walk-forward backtest comparisons (MAE, RMSE, actual vs. predicted curves), 3×7 spatial heatmap, and live failure-mode switches (`DATA_OUTAGE`, `LLM_OUTAGE`). |

---

## ⚙️ 4. How the Engine Works

### 4.1 Canonical Microeconomic Net-Return Engine (`services/decision/net_return.py`)
Every financial recommendation enforces strict accounting invariants—most notably **no double-spoilage deduction** (spoilage reduces physical saleable quantity $Q_{\text{sold}}$, never subtracted twice as cash):

$$Q_{\text{after\_holding}} = Q_{\text{initial}} \times \prod (1 - \text{daily\_holding\_loss}[d])$$

$$Q_{\text{sold}} = Q_{\text{after\_holding}} \times \prod (1 - \text{hourly\_travel\_loss}[h])$$

$$\text{Net Realization} = (Q_{\text{sold}} \times P_{\text{mandi}} \times \text{QualityFactor}) - (\text{Transport} + \text{Hamali} + \text{Fees} + \text{Storage} + \text{Financing})$$

### 4.2 Weather-to-Economics Mapping (`services/decision/weather_effects.py`)
Instead of applying arbitrary price bumps for rain, KrishiNirnay maps physical weather observations (Open-Meteo temperatures/rainfall and IMD `GREEN`/`YELLOW`/`RED` alerts) directly to **holding loss multipliers**, **transit time delays**, and **quality factor adjustments**. If external weather APIs fail, no effects are fabricated.

### 4.3 Six-Family Composite Risk Engine (`services/decision/risk_engine.py`)
Every Wait/Go recommendation passes through six weighted risk gates (`GREEN = 0.0`, `YELLOW = 0.5`, `RED = 1.0`):
1. **Price Drop Risk** *(weight `0.25`)* — Downside $q20$ exposure and 3-day momentum drop.
2. **Arrival Volume Spike** *(weight `0.20`)* — Incoming mandi glut depressing local demand.
3. **Market Volatility** *(weight `0.15`)* — Recent dispersion across trading sessions.
4. **Data Freshness** *(weight `0.15`)* — Trading calendar gap between observed APMC sessions.
5. **Forecast Reliability** *(weight `0.15`)* — Historical out-of-sample confidence width.
6. **Weather Disruption** *(weight `0.10`)* — Rain/heat degradation and road delay impact.

### 4.4 Honest Walk-Forward ML Evaluation (`reports/forecast/xgboost_walk_forward_summary.json`)
We do not hide behind opaque black-box claims. Across **42 chronological out-of-sample series-horizon comparisons** (Horizons 1–7 days, cutoff `2026-04-22`):
- **Last-Observed Baseline Won:** `30` comparisons *(71.4%)*
- **7-Day Moving Average Won:** `9` comparisons *(21.4%)*
- **Candidate XGBoost Won:** `3` comparisons *(7.1%)*

Because agricultural spot series exhibit strong short-term persistence, our production gate keeps XGBoost in **experimental validation mode** (`candidate_not_promoted`) and promotes the winning baseline—ensuring reliable, un-overfitted decisions.

### 4.5 🛡️ Bilingual AI & Zero-Hallucination Number Guard (`apps/api/llm/number_guard.py`)
The LLM layer (Gemini / Groq / Deterministic Fallback) **never performs math**. Every numeric token—supporting both **Arabic (`0–9`)** and **Devanagari (`०–९`)** digits—generated in AI responses is intercepted and verified against the authorized number whitelist of the immutable `DecisionRecord`. Any hallucinated figure is blocked automatically.

---

## 🏗️ 5. System Architecture & Tech Stack

```text
                    ┌─────────────────────────────────────────────────────────┐
                    │                    Farmer Interfaces                    │
                    │   • Web Companion PWA (React 18 + Vite + Tailwind)      │
                    │   • Mobile Client (React Native + Expo)                 │
                    │   • Dual Dialect: Marathi (मराठी) & English (en-IN)     │
                    └────────────────────────────┬────────────────────────────┘
                                                 │ HTTP / REST / WebSocket
                    ┌────────────────────────────▼────────────────────────────┐
                    │               FastAPI Public Gateway                    │
                    │   CORS • Rate Limiting • Security & Correlation IDs     │
                    └────────────────────────────┬────────────────────────────┘
                                                 │
                    ┌────────────────────────────▼────────────────────────────┐
                    │        Bounded AI Orchestration Layer (LLM)             │
                    │   • Intent State Machine + Progressive Slot Filling     │
                    │   • Primary: Gemini 3.8 Flash | Fallback: Groq / Rules  │
                    │   • 🛡️ NUMBER GUARD (Arabic & Devanagari Digit Check)  │
                    └────────────────────────────┬────────────────────────────┘
                                                 │
                    ┌────────────────────────────▼────────────────────────────┐
                    │            Deterministic Decision Engine                │
                    │   • Net Realization & Sequential Spoilage               │
                    │   • Multi-Mandi Routing & Spatial Arbitrage             │
                    │   • Reservation Price, 6-Risk Engine & Scenarios        │
                    └───────────────┬─────────────────────────┬───────────────┘
                                    │                         │
          ┌─────────────────────────▼────────┐      ┌─────────▼────────────────────────┐
          │     Data & Forecasting Tier      │      │     External Service Adapters     │
          │  • AGMARKNET Clean Series        │      │  • OpenRouteService (Geo Routing)│
          │  • Last / MA-7 Production Rules  │      │  • Open-Meteo & IMD Alerts       │
          │  • Experimental XGBoost Audit    │      │  • Zero-Key Offline Snapshots    │
          └──────────────────────────────────┘      └──────────────────────────────────┘
```

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend Web PWA** | React 18.3, TypeScript 5.7, Vite 6.1, Tailwind CSS 3.4, Lucide Icons |
| **Mobile Client** | React Native, Expo |
| **Backend Gateway** | FastAPI 0.115, Uvicorn, Starlette (<0.39), Pydantic v2, WebSockets |
| **Data & ML** | Pandas, NumPy, Scikit-learn, XGBoost, PyArrow, Parquet/CSV |
| **AI & Voice** | Gemini Flash, Groq (`openai/gpt-oss-20b`), Groq Whisper ASR, Custom Number Guard |
| **Testing & QA** | Pytest (72 automated unit, contract, golden-fixture, and E2E tests) |

---

## 🚀 6. Quick Start & Running Locally

### 6.1 Prerequisites
- **Python:** `3.10` or `3.11` (with `pip`)
- **Node.js:** `18.0+` (with `npm`)

### 6.2 Clone the Repository
```bash
git clone https://github.com/Parth-Chavan-15/Syrus7_Ode_to_Code.git
cd Syrus7_Ode_to_Code
```

### 6.3 Option A: One-Click Windows Launch
If your environment already has Python and Node dependencies installed, launch both servers in two command windows automatically:
```cmd
scripts\start_demo.bat
```

### 6.4 Option B: Step-by-Step Setup (Windows / Linux / macOS)

#### Step 1: Start the Backend Gateway (`http://localhost:8000`)
```bash
# 1. Create and activate a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 2. Install backend dependencies
pip install fastapi==0.115.0 "starlette<0.39.0" uvicorn pydantic pyyaml pandas numpy scikit-learn xgboost pyarrow requests joblib jsonschema httpx python-multipart pytest

# 3. (Optional) Configure .env for live external API keys
cp .env.example .env

# 4. Run the FastAPI Gateway
python run_gateway.py
```
- **API Base:** [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

#### Step 2: Start the Web Dashboard (`http://localhost:3000`)
Open a second terminal in the repository root:
```bash
cd apps/web
npm install
npm run dev
```
- **Web App:** [http://localhost:3000](http://localhost:3000) *(Vite proxies `/api` and `/ws` automatically to port `8000`)*

> **Zero-Key Offline Mode:** KrishiNirnay operates **100% offline out-of-the-box** using verified historical AGMARKNET snapshots, local road routes, and deterministic fallback narration—even if `.env` has no API keys!

#### Step 3: Verify Installation & Run Tests
To confirm all economic invariants, contracts, Number Guard filters, and API routes work properly:
```bash
python run_tests.py
```
This runs the full 72-test suite across `tests/test_golden_fixture.py`, `tests/test_number_guard.py`, `tests/test_public_api_endpoints.py`, `tests/test_e2e_consistency.py`, `tests/test_failure_modes.py`, `tests/test_glossary_and_slots.py`, and `unit`/`contract`/`integration` subdirectories (`72 passed`).

---

## 📂 7. Repository Structure

```text
KrishiNirnay/
├── apps/
│   ├── api/                      # FastAPI Public Gateway, Routes & Security Middleware
│   │   ├── llm/                  # Orchestrator, LLM Adapters & Number Guard
│   │   ├── routes/               # assist, demo, health, market, model_validation, scenario, voice
│   │   └── voice/                # Whisper ASR, TTS & Agricultural Glossary
│   ├── web/                      # React 18 + TypeScript + Vite PWA Dashboard
│   │   └── src/components/       # Decision, Heatmap, What-If, Bill, Assistant & Validation UI
│   └── mobile/                   # React Native + Expo Mobile Client
├── configs/                      # app_config.yaml, cost_config.yaml, risk_rules.yaml, route_config.yaml
├── contracts/                    # Canonical Pydantic schemas (DecisionRecord, Assist, Market)
├── data/
│   ├── raw/                      # AGMARKNET records (Maharashtra Tomato & Onion)
│   └── clean/                    # Daily analytical model series CSV
├── docs/
│   ├── assets/                   # Dashboard preview screenshot
│   └── integration/              # Dataset, economics, feature ledger & test audit reports
├── reports/forecast/             # Walk-forward evaluation summary JSON & comparison CSVs
├── scripts/                      # start_demo.bat, verify_contracts.py, evaluate_baselines.py
├── services/
│   ├── decision/                 # net_return, risk_engine, weather_effects, reservation_price, route_cost
│   ├── forecast/                 # Time-series baseline & experimental ML predictors
│   └── adapters/                 # Integration adapters
├── tests/                        # 72 automated unit, contract, golden-fixture & E2E tests
├── run_gateway.py                # FastAPI server entrypoint (port 8000)
├── run_tests.py                  # Full pytest suite runner
└── README.md                     # Project documentation
```

---

## 📄 8. Audit Documentation & Team

For deep technical reviewers and competition judges, full engineering audits are maintained in `docs/integration/`:
- [`branch_inventory.md`](docs/integration/branch_inventory.md) — Architectural mapping across data, economics, and AI divisions.
- [`dataset_audit.md`](docs/integration/dataset_audit.md) — AGMARKNET data schema, date coverage, and deduplication checks.
- [`economics_audit.md`](docs/integration/economics_audit.md) — Cost parameter audit categorizing verified vs. configurable assumptions.
- [`test_report.md`](docs/integration/test_report.md) — Detailed integration verification log.

---

<div align="center">

**Built for Syrus 7.0 (Ode-to-Code 2026) — Agriculture PS_02**  
[Parth-Chavan-15/Syrus7_Ode_to_Code](https://github.com/Parth-Chavan-15/Syrus7_Ode_to_Code)

*“Sahi Bhav Se, Samriddhi Ki Raah Pe.”*

</div>
