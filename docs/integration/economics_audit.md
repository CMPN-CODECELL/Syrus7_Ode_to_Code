# KrishiNirnay — Economics & Cost Audit Report

**Project:** KrishiNirnay — “Sahi Bhav Se, Samriddhi Ki Raah Pe”  
**Challenge:** Syrus 7.0 / Agriculture PS2 — AI Market and Risk Intelligence for Agri Supply Chains  
**Date of Audit:** 2026-10-09  
**Audit Boundary:** Division 2 Decision, Risk & Economics Engine, Cost Configuration, Logistics, and Perishability Models  

---

## 1. Executive Summary

Official market data portals (AGMARKNET / data.gov.in) provide observed mandi prices and arrivals, but **zero operational cost information**. In agricultural supply chains, headline price differences between mandis are frequently eroded or reversed by logistics costs, labour, storage, and perishability losses.

This audit:
1. Itemizes every cost and loss parameter required by the canonical net-return formula.
2. Formally audits each parameter's provenance and classifies it as `VERIFIED`, `USER_PROVIDED`, `ASSUMPTION`, or `UNKNOWN`.
3. Validates the **no double-spoilage** invariant and sequential loss math.
4. Explains how unknown or missing inputs are handled without silent zero substitution.
5. Documents the versioned configuration file (`configs/cost_config.yaml`).

---

## 2. Parameter Provenance & Classification Audit

| Parameter | Default Value | Canonical Unit | Provenance Status | Geography / Scope | Source Reference & Verification Date | Editable Config Key |
|---|---|---|---|---|---|---|
| **Price Unit** | ₹/qtl | INR / quintal | **VERIFIED** | Maharashtra APMCs | Standard AGMARKNET trade currency & weight unit | `price_unit` |
| **Quantity Unit** | qtl | quintal | **VERIFIED** | All | 1 qtl = 100 kg, 1 tonne = 10 qtl | `quantity_unit` |
| **Farmer APMC Commission** | 0.0% | % of gross revenue | **VERIFIED** | Maharashtra | Maharashtra APMC Regulation Act Amendment (Farmer commission prohibited) — Verified 2024-01-01 | `commission_and_fees.farmer_commission_pct` |
| **APMC Development Cess** | 1.0% | % of gross revenue | **ASSUMPTION** | Maharashtra APMCs | Representative APMC user cess fee schedule (varies by market 0.5%–1.5%) | `commission_and_fees.market_fee_pct` |
| **Transport Rate per Km** | ₹12.0 | INR / km | **ASSUMPTION** | Nashik district | Representative light commercial vehicle (Bolero Maxi / 407) hiring rate (illustrative benchmark) | `transport.rate_per_km` |
| **Round Trip Factor** | 2.0 | Multiplier | **ASSUMPTION** | Rural Maharashtra | Transporter contracts standardly bill for round-trip return to origin | `transport.round_trip_factor` |
| **Vehicle Payload Capacity** | 25.0 (Medium) | quintals | **VERIFIED** | Standard 407 / 6-wheeler | Manufacturer rated gross payload (~2.5 MT) | `transport.default_vehicle_payload_qtl` |
| **Road Factor (Routing)** | 1.25 | Multiplier | **ASSUMPTION** | Rural roads | Straight-line to road distance multiplier when ORS route is unavailable | `transport.road_factor` |
| **Labour: Hamali / Tolai** | ₹12.0 | INR / quintal | **ASSUMPTION** | Nashik APMC | APMC market handling, unloading & weighment schedule (~₹240 for 20 qtl) | `hamali_tolai.default_per_qtl` |
| **Holding Storage: Tomato** | ₹2.0 | INR / qtl / day | **ASSUMPTION** | APMC crate yards | Local crate yard holding charges (ambient shelter) | `storage.tomato_per_qtl_day` |
| **Holding Storage: Onion** | ₹1.5 (Yard) / ₹0.5 (Chawl) | INR / qtl / day | **ASSUMPTION** | Lasalgaon / Pimpalgaon | Traditional farm chawl holding cost estimate | `storage.onion_per_qtl_day` |
| **Annual Capital Financing** | 12.0% | % per annum | **ASSUMPTION** | Maharashtra | Standard Kisan Credit Card (KCC) / local informal interest rate baseline | `financing.annual_rate` |
| **Holding Loss: Tomato (0–2d)** | 1.0% / day (2% total) | Proportion | **ASSUMPTION** | Ambient ambient | Post-harvest research priors for ambient tropical tomato storage | `spoilage.tomato.holding.days_0_2` |
| **Holding Loss: Tomato (3–5d)** | 3.5% / day | Proportion | **ASSUMPTION** | Ambient ambient | Accelerating ambient perishability decay curve | `spoilage.tomato.holding.days_3_5` |
| **Holding Loss: Tomato (6+d)** | 7.0% / day | Proportion | **ASSUMPTION** | Ambient ambient | Rapid rot and total breakdown threshold | `spoilage.tomato.holding.days_6_plus` |
| **Holding Loss: Onion (0–2d)** | 0.10% / day | Proportion | **ASSUMPTION** | Traditional chawl | ICAR-DOGR onion storage shrinkage priors | `spoilage.onion.holding.days_0_2` |
| **Holding Loss: Onion (3–5d)** | 0.15% / day | Proportion | **ASSUMPTION** | Traditional chawl | ICAR-DOGR onion storage shrinkage priors | `spoilage.onion.holding.days_3_5` |
| **Holding Loss: Onion (6+d)** | 0.20% / day | Proportion | **ASSUMPTION** | Traditional chawl | ICAR-DOGR onion storage shrinkage priors | `spoilage.onion.holding.days_6_plus` |
| **Transit Loss: Tomato (Crates)**| 0.15% / hour | Proportion / hr | **ASSUMPTION** | Road transit | Crates with ventilation shrinkage trials | `spoilage.tomato.travel.hourly_crate` |
| **Transit Loss: Tomato (Bags)** | 0.40% / hour | Proportion / hr | **ASSUMPTION** | Road transit | Loose bags transit compression damage | `spoilage.tomato.travel.hourly_loose` |
| **Transit Loss: Onion** | 0.05% / hour | Proportion / hr | **ASSUMPTION** | Road transit | Minimal road vibration shrinkage | `spoilage.onion.travel.hourly_crate` |
| **Quality Factor** | 1.0 (Standard) | Multiplier | **USER_PROVIDED** | Lot-specific | Defaults to 1.0; only modified if farmer reports damaged grade | Engine input parameter |
| **Farmer Bag Weight** | Required for bags | kg / bag | **USER_PROVIDED** | Specific lot | Unweighted bags are flagged missing slot; NEVER guessed | Slot validation rule |

---

## 3. Canonical Net Realization & Spoilage Math

### 3.1 Sequential Compounding (Non-Additive)
Perishability losses occur chronologically in sequence rather than additively:
1. **Holding Loss over $D$ days:**
   $$Q_{\text{after\_holding}} = Q \times \prod_{d=1}^{D} (1 - \text{daily\_holding\_loss}[d])$$
2. **Transit Loss over $H$ hours:**
   $$Q_{\text{sold}} = Q_{\text{after\_holding}} \times \prod_{h=1}^{H} (1 - \text{hourly\_travel\_loss}[h])$$
3. **Gross Revenue:**
   $$\text{Gross Revenue} = Q_{\text{sold}} \times P(\text{mandi}, \text{day}) \times \text{Quality Factor}$$

### 3.2 The Strict No Double-Spoilage Invariant
- **Rule:** If quantity sold ($Q_{\text{sold}}$) is reduced to account for physical spoilage and shrinkage, the monetary value of that lost produce is **already excluded from Gross Revenue**.
- **Invariant:** The system strictly **never deducts $(\text{Spoilage Loss} \times P)$ a second time from Net Realization**.
- **Net Formula:**
  $$\text{Net} = \text{Gross Revenue} - \text{Transport} - \text{Hamali/Tolai} - \text{Market Fees} - \text{Storage} - \text{Financing}$$

### 3.3 Multiple Trips & Payload Constraints
$$\text{Trips} = \left\lceil \frac{Q_{\text{harvest}}}{V_{\text{payload}}} \right\rceil$$
$$\text{Transport Cost} = \text{Rate}_{\text{km}} \times \text{Distance}_{\text{km}} \times \text{Round Trip Factor} \times \text{Trips}$$
If shared transport is enabled:
$$\text{Farmer Transport} = \text{Transport Cost} \times \text{Farmer Load Share}$$

### 3.4 Capital Financing Cost
$$\text{Financing Cost} = \text{Capital Tied Up} \times \text{Annual Rate} \times \frac{\text{Holding Days}}{365}$$
Where $\text{Capital Tied Up}$ is the opportunity cost of the immediate baseline net realization ($\text{Net}_{\text{Sell\_Now}}$).

---

## 4. Break-Even Reservation Price Formulation

For any candidate wait or alternative mandi decision, the exact break-even reservation price $P_{\text{breakeven}}$ is calculated deterministically as the future market price required for the candidate net return to equal the Sell Now baseline net return:

$$P_{\text{breakeven}} = \frac{\text{Net}_{\text{Sell\_Now}} + \text{Total Deductions}_{\text{candidate}}}{Q_{\text{sold, candidate}} \times \text{Quality Factor}}$$

Displayed prominently on the decision dashboard as:
> *“Do not accept below ₹1,842 / qtl.”*

---

## 5. Non-Fabrication Rules for Unknowns

1. **Unknown Transport Costs:** If vehicle payload, distance, or transport rate is unknown, the system generates an explicit assumption warning or returns `INSUFFICIENT_EVIDENCE`. It **never silently uses ₹0 transport cost**.
2. **Weak Route Evidence:** If routing relies on a rough Haversine estimate rather than verified road coordinates, a close "Go to another mandi" recommendation is automatically **blocked** to prevent farmers from traveling on unverified logistics.
3. **Weather Effects:** Weather alerts (Open-Meteo & IMD) influence physical perishability rates and transit speeds. The system **never fabricates an arbitrary price increase (e.g. "+₹200 rain bonus")**.
4. **Arrivals Elasticity:** In arrival surge scenarios ($2\times$ arrivals), arrival risk is recalculated. The system **does not invent an arbitrary numerical price-drop elasticity without empirical calibration**.
