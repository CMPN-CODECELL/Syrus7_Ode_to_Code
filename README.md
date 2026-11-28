# 🌾 KrishiNirnay (कृषिनिर्णय)

> **“Sahi Bhav Se, Samriddhi Ki Raah Pe”** — *Helping farmers choose the best day and market to sell for maximum take-home profit.*

[![Syrus 7.0](https://img.shields.io/badge/Syrus%207.0-Agriculture%20PS__02-2E7D32?style=for-the-badge)](https://github.com/Parth-Chavan-15/Syrus7_Ode_to_Code)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%20%7C%203.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![Tests](https://img.shields.io/badge/Tests-72%20Passed-brightgreen?style=for-the-badge&logo=pytest&logoColor=white)](#verify-with-automated-tests-optional)
[![Languages](https://img.shields.io/badge/Languages-मराठी%20%7C%20English-FF9933?style=for-the-badge)](#what-you-can-do-in-the-app)

**Quick Navigation:** [Why It Matters](#why-krishinirnay-the-problem) • [Real Example](#real-example-how-one-decision-earns-2095-more) • [Features](#what-you-can-do-in-the-app) • [How It Works](#how-the-decision-engine-works) • [Quick Start](#quick-start-guide-run-in-3-minutes)

---

## Dashboard Preview

![KrishiNirnay Farmer Decision Dashboard](docs/assets/dashboard_preview.png)

*Interactive decision dashboard featuring commodity inputs, road route distance calculation, round-trip vehicle costing, storage selection, live mandi arrivals, and the Krishi Mitra AI Copilot.*

---

## Why KrishiNirnay? (The Problem)

Over **86% of Indian farmers are small and marginal**, frequently forced into **distress selling**—selling fresh produce immediately after harvest at rock-bottom local prices due to urgent cash needs, fear of spoilage, and lack of clear market guidance.

> *“I have 20 quintals of harvested tomatoes in Niphad. Should I sell today at Nashik APMC for ₹1,800/qtl, or wait 2 days and sell when rates rise?”*

Most farming apps only show daily market rate lists. However, **a higher mandi price does not always mean more money in the farmer's hand.** Every selling decision hides real-world costs:

- **Crop Spoilage:** Perishables like tomatoes lose weight every day they sit in storage and during bumpy road transport.
- **Round-Trip Travel Costs:** Fuel, vehicle capacity limits (pickup vs. truck), and return trips add up quickly.
- **Market Handling Fees:** Labour (*hamali*) and weighing (*tolai*) deductions at the mandi.
- **Cost of Waiting:** Delayed cash payout ties up working capital needed for urgent farm expenses.

**KrishiNirnay solves this by calculating actual take-home cash after every cost and risk—giving farmers one clear, trustworthy answer: Sell Today, Wait, or Travel to another mandi.**

---

## Real Example: How One Decision Earns +₹2,095 More

Consider a farmer with **20 quintals of Tomatoes near Nashik APMC** (today's rate: **₹1,800/qtl**, 60 km transport, ₹12/qtl *hamali/tolai*, and a projected Day-2 rate of **₹1,950/qtl**):

| Option | Harvest Weight Sold | Costs Deducted | Net Cash in Hand |
| :--- | :--- | :--- | :--- |
| **Sell Today (Baseline)** | 20.0 qtl sold @ ₹1,800/qtl | ₹1,440 transport + ₹240 labour/handling | **₹33,960** |
| **Wait 2 Days (Recommended)** | 19.4 qtl left after natural shrinkage @ ₹1,950/qtl | Transport + labour + storage + waiting interest | **₹36,055** |

### What the Farmer Sees:
- **Recommended Action:** Wait 2 Days at Nashik APMC
- **Extra Profit Earned:** **+₹2,095** *(+6.17% higher cash in hand)*
- **Safety Floor (Break-Even Price):** **₹1,842 / qtl** — *“Do not accept below ₹1,842/qtl; if prices drop under this, selling today is safer.”*
- **Success Confidence:** **62.4%** chance of beating today's net payout.

---

## What You Can Do in the App

| Screen / Feature | How It Helps |
| :--- | :--- |
| **📈 Market Advice** | Instant **Sell Now / Wait / Travel** decision with side-by-side comparison of nearby mandis (Nashik, Pimpalgaon Baswant, Sangamner) and a 7-day price trend. |
| **🧪 What-If Planner** | Interactive sliders to test surprises—such as a 10% price drop, 20% fuel hike, or double market arrivals—before making a move. |
| **💰 Expense Bill** | Clear, line-by-line receipt showing gross earnings, crop weight lost to spoilage, fuel, *hamali*, storage rental, and waiting cost. |
| **🌾 My Farm & Language Switch** | 1-tap switching between **मराठी (Marathi)** and **English**, Taluka catchment selection, storage choices (Open Shed, Crates, Cold Storage), and live mandi ticker updates. |
| **🤖 Krishi Mitra AI Copilot** | Bilingual voice and text assistant that asks smart follow-up questions if crop, quantity, or market details are missing—never guessing blindly. |
| **📊 Judge & Audit Tools** | Built-in transparency panel showing historical backtest accuracy, 3×7 regional price heatmaps, and live outage simulation controls. |

---

## How the Decision Engine Works

### 1. Real Net Profit Calculation
Instead of guessing from raw prices, every option is evaluated with strict real-world accounting (crop shrinkage reduces physical weight sold—never double-counted as an extra fee):

```text
Saleable Weight = Starting Weight × (1 - Daily Storage Loss) × (1 - Transit Loss)

Net Cash Profit = (Saleable Weight × Expected Mandi Price)
                  - Round-Trip Transport Cost
                  - Loading & Mandi Fees (Hamali / Tolai)
                  - Storage Rental Cost
                  - Financing / Opportunity Cost of Waiting
```

### 2. Weather & Spoilage Protection
Live weather observations (temperature, rainfall, and IMD color alerts) directly adjust **storage spoilage speed** and **road travel delays**. The engine never invents artificial price spikes when it rains; it models physical damage and transit risk honestly.

### 3. Six-Point Risk Safety Check
Before recommending holding or travelling, the engine checks six risk signals:
1. **Price Drop Risk** (chance of rates falling below the break-even floor)
2. **Market Arrival Spike** (oversupply crashing local prices)
3. **Price Volatility** (sharp day-to-day swings)
4. **Data Freshness** (whether APMC trading data is current or delayed)
5. **Forecast Reliability** (spread of historical prediction error)
6. **Severe Weather Alerts** (heatwaves or heavy rain along the route)

### 4. Honest Price Forecasting (Zero AI Hype)
Rather than forcing complex machine learning where simpler models perform better, we backtested across **42 chronological out-of-sample market windows** (1 to 7 days ahead):
- **Last-Observed Baseline:** Won **30** times *(71.4%)*
- **7-Day Moving Average:** Won **9** times *(21.4%)*
- **Experimental XGBoost Model:** Won **3** times *(7.1%)*

Because agricultural prices carry strong short-term persistence, KrishiNirnay promotes the winning baseline in live decisions while keeping XGBoost visible in the Judge Validation panel for full scientific transparency.

### 5. Zero-Hallucination AI Guard
Our AI assistant **never calculates money on its own**. Every financial calculation runs inside verified Python logic. A built-in **Number Guard** checks every number in the AI's reply—supporting both standard digits (`0–9`) and Marathi/Devanagari digits (`०–९`)—and blocks any invented figure before it reaches the farmer.

---

## System Architecture & Tech Stack

```text
   [ Web Dashboard (React + Vite) ]     [ Mobile App (React Native + Expo) ]
                 \                                     /
                  \────── HTTP / REST / WebSocket ────/
                                    │
                                    ▼
                        [ FastAPI Public Gateway ]
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
   [ Bilingual AI Assistant ]           [ Deterministic Decision Engine ]
   • Progressive Q&A Flow               • Net Profit & Break-Even Math
   • Marathi & English Voice            • Multi-Mandi Routing & Arbitrage
   • Number Guard Anti-Hallucination    • 6-Point Risk & Weather Impact
                                                      │
                                                      ▼
                                        [ Data & Forecast Layer ]
                                        • Historical AGMARKNET Series
                                        • Walk-Forward Model Evaluation
                                        • Offline Verified Snapshots
```

| Layer | Technologies |
| :--- | :--- |
| **Frontend Web App** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Mobile Companion** | React Native, Expo |
| **Backend Server** | FastAPI, Uvicorn, Pydantic, WebSockets |
| **Data & Forecasting** | Python, Pandas, NumPy, Scikit-learn, XGBoost |
| **AI & Voice** | Gemini Flash, Groq, Whisper Speech-to-Text, Custom Number Guard |

---

## Quick Start Guide (Run in 3 Minutes)

### Prerequisites
- **Python 3.10 or 3.11** (with `pip`)
- **Node.js 18+** (with `npm`)

### Step 1: Clone the Repository
```bash
git clone https://github.com/Parth-Chavan-15/Syrus7_Ode_to_Code.git
cd Syrus7_Ode_to_Code
```

### Step 2: Start the Backend Server
```bash
# Create and activate a virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS / Linux:
source venv/bin/activate

# Install Python dependencies
pip install fastapi==0.115.0 "starlette<0.39.0" uvicorn pydantic pyyaml pandas numpy scikit-learn xgboost pyarrow requests joblib jsonschema httpx python-multipart pytest

# Start the backend API server
python run_gateway.py
```
Once running, the backend is live at **http://localhost:8000** (API docs available at **http://localhost:8000/docs**).

### Step 3: Start the Web Dashboard
Open a **second terminal** in the project folder:
```bash
cd apps/web
npm install
npm run dev
```
Open your browser and go to **http://localhost:3000**.

> **Works 100% Offline:** You do not need any external API keys to explore the full app. KrishiNirnay automatically uses verified historical market data, cached routes, and deterministic local narration when keys are omitted.

*(Optional)* **One-Click Windows Launch:** If dependencies are already installed globally, double-click or run `scripts\start_demo.bat` to launch both servers automatically.

### Verify with Automated Tests (Optional)
Run the automated verification suite covering all economic formulas, risk rules, API routes, and AI safety checks:
```bash
python run_tests.py
```
*Expected output: `72 passed`.*

---

## Project Overview

```text
Syrus7_Ode_to_Code/
├── apps/
│   ├── api/          # Backend server, AI chat orchestrator, voice & safety checks
│   ├── web/          # React + TypeScript farmer dashboard
│   └── mobile/       # Expo mobile app
├── configs/          # Cost, transport, risk, and route configurations
├── contracts/        # Shared data schemas between backend and frontend
├── data/             # Verified Maharashtra Tomato & Onion market datasets
├── docs/             # Dashboard screenshots and audit documentation
├── reports/          # Walk-forward model comparison metrics
├── scripts/          # One-click launch & evaluation scripts
├── services/         # Core economic, risk, weather, and forecasting logic
├── tests/            # 72 automated tests verifying accuracy and edge cases
├── run_gateway.py    # Backend launcher
└── run_tests.py      # Test suite runner
```

---

## Team & Competition

- **Project:** KrishiNirnay (कृषिनिर्णय)
- **Competition:** Syrus 7.0 (Ode-to-Code 2026) — Agriculture PS_02
- **Repository:** [Parth-Chavan-15/Syrus7_Ode_to_Code](https://github.com/Parth-Chavan-15/Syrus7_Ode_to_Code)

*Built to bring transparent math and fair earnings to Indian agriculture.*
