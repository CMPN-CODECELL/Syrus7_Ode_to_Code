# KrishiNirnay — Division 2: Decision, Risk & Economics Engine
**Agriculture PS_02: AI Market and Risk Intelligence for Agri Supply Chains**  
*Official Product Tagline:* **“Sahi Bhav Se, Samriddhi Ki Raah Pe.”**  
*Authority:* `SYRUS_PS02_MASTER.md` (Single Source of Truth) & `SYRUS_PS02_DIVISION_2_DECISION_RISK_ENGINE.md`

---

## 1. Executive Summary & Responsibility Boundary

KrishiNirnay is an AI-powered market and risk intelligence platform for agricultural supply chains. This module represents **Division 2 — Decision, Risk and Economics**, the deterministic economic brain that converts market snapshots, forecast distributions, routing logistics, and weather intelligence into a reproducible **Sell Now / Wait / Go to another mandi** decision.

### Division 2 Scope & Ownership
* **Canonical Net-Return Engine:** Single production financial formula with sequential spoilage modelling.
* **Transport Cost & Routing:** OpenRouteService integration (`api.heigit.org`), vehicle payload constraints, multiple trips, shared transport, and weak-route Go blocking.
* **Weather-to-Economics:** Numerical weather (Open-Meteo) & official alerts (IMD) converted to physical and logistics consequences (no artificial price bumps).
* **Six-Risk Engine:** Price drop, arrival spike, volatility, stale data, forecast reliability, and weather risks with deterministic safety overrides.
* **Decision Policy:** Cautious ($q20$), Balanced ($q35$), and Aggressive ($q50$) profiles with margin and conformal probability gates.
* **Reservation Price Engine:** Exact break-even and threshold calculation (*"Do not accept below ₹X/qtl"*).
* **Deterministic Scenarios:** What-if simulation engine that executes the identical production pipeline on deep-cloned states without mutating source records.
* **Immutable `DecisionRecord`:** Structured, validated single source of numerical truth for dashboards, LLM explanations, and voice summaries.

---

## 2. Architecture & Pipeline

```text
  Division 1 Contracts (Market, Forecast, Calendar, Freshness)
                          +
  External Adapters (ORS Routing via api.heigit.org, Open-Meteo, IMD)
                          │
                          ▼
            ┌─────────────────────────────┐
            │   Canonical Net-Return      │ ◄── Sequential Spoilage:
            │      Q_sold × P × QF        │     Q_after_holding = Q × Π(1 - holding[d])
            │        - Logistics          │     Q_sold = Q_after_holding × Π(1 - travel[h])
            │        - Storage            │     Revenue = Q_sold × P × QF
            │        - Financing          │     Net = Revenue - Costs
            └─────────────┬───────────────┘
                          │
                          ▼
            ┌─────────────────────────────┐
            │       Six-Risk Engine       │ ◄── Flags: Price Drop, Arrival Spike,
            │    Weighted Score R < 0.25  │     Volatility, Stale Data, Forecast, Weather
            │      Safety Overrides       │     Overrides: Stale-Red, Forecast-Red,
            └─────────────┬───────────────┘     2+ Reds -> Red, 3+ Yellows -> Yellow
                          │
                          ▼
            ┌─────────────────────────────┐
            │    Decision Policy Gates    │ ◄── Baseline: SELL NOW at Home Mandi
            │   Cautious / Balanced / Agg │     Wait Gate: Gain % + P(beat) + No Red Risk
            │     Hysteresis Defense      │     Go Gate: Alt Net > Home + Reliable Route
            └─────────────┬───────────────┘
                          │
                          ▼
            ┌─────────────────────────────┐
            │   Immutable DecisionRecord  │ ──► FastAPI Gateway & Dashboard
            │   Deterministic Evidence    │ ──► Controlled LLM Explanation
            │     Reservation Price       │ ──► Concise Voice Verdict (TTS)
            └─────────────────────────────┘
```

---

## 3. Core Formulas & Invariants

### 3.1 Canonical Net Realization
$$Q_{\text{after\_holding}} = Q \times \prod_{d=1}^{D} (1 - \text{daily\_holding\_loss}_d)$$
$$Q_{\text{sold}} = Q_{\text{after\_holding}} \times \prod_{h=1}^{H} (1 - \text{hourly\_travel\_loss}_h)$$
$$\text{Revenue} = Q_{\text{sold}} \times P \times \text{quality\_factor}$$
$$\text{Net} = \text{Revenue} - \text{transport} - \text{hamali/tolai} - \text{commission/fees} - \text{storage} - \text{financing}$$

* **Sequential Invariant:** Spoilage and transit losses occur sequentially. Loss percentages must never be directly added.
* **No Double-Counted Spoilage Invariant:** $Q_{\text{sold}}$ already excludes spoiled volume. The lost quantity's monetary value is **never** subtracted a second time from Net realization.
* **Frozen Units:** Quantity is strictly in quintals (`qtl`), prices in $\text{INR/qtl}$. Conversions: $1\text{ qtl} = 100\text{ kg} = 0.1\text{ tonne}$. Ambiguous bag counts without bag weight are rejected.

### 3.2 Transport & Routing
$$\text{trips} = \left\lceil \frac{Q_{\text{qtl}}}{\text{vehicle\_payload\_qtl}} \right\rceil$$
$$\text{Transport}_{\text{total}} = \text{rate\_per\_km} \times \text{distance\_km} \times \text{round\_trip\_factor} \times \text{trips}$$
$$\text{Farmer Transport} = \text{Transport}_{\text{total}} \times \text{farmer\_load\_share}$$
* Routing connects to OpenRouteService via current `api.heigit.org` endpoints (deprecated `api.openrouteservice.org` is strictly prohibited).
* Fallback hierarchy: ORS live $\rightarrow$ cached route $\rightarrow$ haversine $\times$ road factor ($1.3$).
* **Weak Route Go Blocking:** If a candidate Go decision relies on an estimated route and the net margin above the gate is within the uncertainty buffer ($<3\%$), Go is blocked.

### 3.3 Financing & Storage Costs
$$\text{Financing Cost} = \text{Capital Tied Up (Baseline Net)} \times \text{annual\_rate} \times \frac{\text{holding\_days}}{365}$$
$$\text{Storage Cost} = Q_{\text{qtl}} \times \text{rate\_per\_qtl\_day} \times \text{holding\_days}$$

### 3.4 Reservation / Break-Even Price
$$P_{\text{break\_even}} = \frac{\text{Baseline Net} + \text{Candidate Total Costs}}{Q_{\text{sold}} \times \text{quality\_factor}}$$
Exposed as: *"Do not accept below ₹X/qtl at destination mandi."*

---

## 4. Six-Risk Engine & Safety Overrides

| Flag | Base Weight | Green ($0.0$) | Yellow ($0.5$) | Red ($1.0$) |
|---|:---:|---|---|---|
| **Price Drop** | $0.25$ | Trajectory stable | Drop prob $\ge 55\%$ OR $q20 \le 97\%$ OR 3d drop $\le -10\%$ | Drop prob $\ge 70\%$ OR $q20 \le 92\%$ OR 3d drop $\le -15\%$ |
| **Arrival Spike** | $0.20$ | Normal weekday range | $r \ge 1.5$ OR robust $z \ge 2.5$ | $r \ge 2.0$ OR robust $z \ge 3.5$ (Catch-up suppressed) |
| **Volatility** | $0.15$ | Within normal bounds | Log-vol $> 75\text{th}\%$ OR spread $> 50\%$ | Log-vol $> 90\text{th}\%$ OR spread $> 100\%$ |
| **Stale Data** | $0.15$ | $0\text{–}1$ expected sessions | $2$ expected sessions | $3+$ expected sessions (**Blocked**) |
| **Forecast** | $0.15$ | Validated & tight band | Width $> 20\%$ OR MASE $0.8\text{–}1.0$ OR cov $65\text{–}75\%$ | Width $> 35\%$ OR MASE $> 1.0$ OR cov $< 65\%$ OR OOD |
| **Weather** | $0.10$ | Favorable | IMD Yellow OR temp $\ge 35^\circ\text{C}$ OR rain $\ge 15.6\text{ mm}$ | IMD Red OR temp $\ge 40^\circ\text{C}$ ($37^\circ\text{C}$ coastal) OR rain $\ge 64.5\text{ mm}$ |

* **Composite Score:** $R = \sum w_i s_i$ ($R < 0.25$ Green, $0.25 \le R < 0.55$ Yellow, $R \ge 0.55$ Red).
* **Deterministic Overrides:**
  * Any Red stale data $\rightarrow$ Overall **RED**.
  * Any Red forecast reliability $\rightarrow$ Overall **RED**.
  * 2+ Red flags $\rightarrow$ Overall **RED**.
  * 3+ Yellow flags $\rightarrow$ At least **YELLOW**.
* **Red Resolution:** Forecast-only Red blocks Wait; Stale/Arrival/Multiple critical Reds block both Wait and Go.

---

## 5. Decision Policy & Risk Appetite

* **Cautious Profile:** Uses $q20$; requires minimum $+5\%$ net gain and $\ge 70\%$ probability of beating baseline.
* **Balanced Profile (Default):** Uses $q35$; requires minimum $+3\%$ net gain and $\ge 65\%$ probability of beating baseline.
* **Aggressive Profile:** Uses $q50$; requires minimum $+1.5\%$ net gain and $\ge 55\%$ probability of beating baseline.
* **Yellow Risk Adjustment:** Multiplies required gain by $1.5\times$ and increases probability threshold by $+5\text{ percentage points}$.
* **Hysteresis:** Degrades immediately on worsening market conditions; requires two consecutive improved observations before upgrading advice near the boundary.

---

## 6. Golden Test Fixtures Verification

The engine has been verified against the exact master fixtures:

* **Fixture 1 (Nashik 20 q Tomato Demo):**
  * Current price ₹1,800/qtl, 60 km, ₹12/km billed round-trip, hamali ₹240, 1% travel loss, 2% holding loss over 2 days, storage ₹2/q/day, 12% p.a. financing.
  * **Sell now net:** **₹33,960** (exact)
  * **Wait at expected ₹1,950:** **₹36,055** (exact)
  * **Wait at cautious ₹1,700:** **₹31,204** (exact)
  * **Break-even future price:** **~₹1,842/qtl** (exact)
  * *Discredited legacy values (₹35,450 / ₹40,350 / ₹36,700) are rejected.*
* **Fixture 2 (Three Mandis Illustrative Baseline):**
  * Home A: **₹35,172**
  * Mandi B: **₹34,554**
  * Mandi C: **₹33,968**
* **Fixture 3 (Forecast Quantile Nets):**
  * $q20$ (₹1,760): **₹33,572**
  * $q35$ (₹1,830): **₹34,938**
  * $q50$ (₹1,900): **₹36,303**
  * Conformal distribution interpolation: **62.4% probability** of beating ~₹1,842.

---

## 7. Directory Structure

```text
├── configs/
│   ├── cost_config.yaml                  # Cost parameters & assumption provenance
│   ├── risk_rules.yaml                   # Risk weights, thresholds & profile gates
│   └── route_config.yaml                 # ORS routing host & logistics params
├── contracts/
│   ├── schemas/
│   │   └── decision_record.schema.json  # JSON Schema for immutable DecisionRecord
│   ├── decision_record.schema.json       # Root DecisionRecord schema
│   ├── decision_request.schema.json      # Request schema
│   ├── scenario.schema.json              # What-if scenario schema
│   ├── risk.schema.json                  # Risk assessment schema
│   └── fixtures/
│       ├── market_snapshot_nashik.json   # Division 1 sample snapshot
│       ├── forecast_distribution_tomato.json # Conformal uncertainty quantiles
│       ├── weather_context_sample.json   # Weather adapter fixture
│       └── golden_fixture_1_request.json # Demo test request
├── services/
│   └── decision/
│       ├── __init__.py                   # Package exports
│       ├── net_return.py                 # Canonical net-return formula
│       ├── route_cost.py                 # ORS routing & vehicle load calculation
│       ├── weather_effects.py            # Weather-to-economics adapter
│       ├── risk_engine.py                # Six-risk engine & overrides
│       ├── reservation_price.py          # Break-even price engine
│       ├── explanation_rules.py          # Deterministic evidence & Why cards
│       ├── decision_record.py            # Pydantic DecisionRecord model
│       ├── decision_policy.py            # Sell/Wait/Go policy coordinator
│       ├── scenario_engine.py            # What-if simulation engine
│       └── api.py                        # Internal FastAPI service endpoints
├── tests/
│   ├── unit/                             # Unit tests for all modules
│   ├── contract/                         # Contract & Golden Fixture tests
│   ├── integration/                      # FastAPI endpoint integration tests
│   └── run_tests.py                      # Dedicated test runner
└── README.md
```

---

## 8. API Endpoints

Owned by Division 2 and consumed by Division 3:

* `POST /internal/analyze-sale-decision` — Analyzes baseline and alternatives; returns immutable `DecisionRecord`.
* `POST /internal/run-scenario` — Clones request, applies what-if stress, and returns structured before/after comparison.
* `GET /internal/weather-context` — Returns location weather and deterministic economic multipliers.
* `GET /internal/health` — Service health and configuration version metadata.

---

## 9. Running Tests

Execute the full test suite (43 tests covering net return, routing, weather, risk flags, policy gates, scenarios, golden fixtures, and API endpoints):

```bash
python run_tests.py
```
Or via pytest:
```bash
python -m pytest tests -v
```
