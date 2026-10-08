/**
 * Shared TypeScript Contracts for KrishiNirnay React Native Mobile App
 */

export interface CostBreakdown {
  gross_revenue: number;
  transport: number;
  hamali_tolai: number;
  commission_fees: number;
  storage: number;
  financing: number;
  travel_loss_pct: number;
  holding_loss_pct: number;
  quality_factor: number;
  quantity_initial_qtl: number;
  quantity_sold_qtl: number;
  final_net: number;
}

export interface BaselineOutcome {
  market: string;
  sale_day: string;
  modal_price: number;
  quantity_sold_qtl: number;
  gross_revenue: number;
  net_total: number;
  cost_breakdown: CostBreakdown;
}

export type ActionType = 'SELL_NOW' | 'WAIT' | 'GO';

export interface ChosenOutcome {
  action: ActionType;
  market: string;
  sale_day: string;
  wait_days: number;
  modal_price_expected: number;
  net_total: number;
  gain_total: number;
  gain_pct: number;
  probability_beat_baseline: number;
  reservation_price: number;
  cost_breakdown: CostBreakdown;
}

export interface ForecastPayload {
  crop: string;
  mandi: string;
  target_date: string;
  q10: number;
  q20: number;
  q35: number;
  q50: number;
  q90: number;
  low: number;
  expected: number;
  high: number;
  reliability: 'HIGH' | 'MEDIUM' | 'LOW';
  rolling_mase: number;
  rolling_80_coverage: number;
  training_end_date: string;
  out_of_range: boolean;
  top_drivers_up: string[];
  top_drivers_down: string[];
  unit: string;
}

export interface RiskFlag {
  id: string;
  name: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  score: number;
  reason: string;
  evidence: string;
}

export interface RiskPayload {
  overall: 'GREEN' | 'YELLOW' | 'RED';
  score: number;
  flags: RiskFlag[];
  safety_override?: string | null;
}

export interface ExplanationPayload {
  verdict: string;
  why: string[];
  key_drivers: string[];
  evidence: string[];
  spoken_summary: string;
}

export interface DecisionRecord {
  request_id: string;
  engine_version: string;
  data_snapshot_id: string;
  rules_version: string;
  forecast_model_version: string;
  calibration_version: string;
  cost_config_version: string;
  weather_snapshot_id: string;
  route_snapshot_id: string;
  timestamp: string;
  commodity: string;
  lot_quantity_qtl: number;
  risk_profile: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE';
  baseline: BaselineOutcome;
  chosen: ChosenOutcome;
  forecast: ForecastPayload;
  risk: RiskPayload;
  warnings: string[];
  assumptions: string[];
  source_refs: string[];
  explanation: ExplanationPayload;
}

export interface HeatmapCell {
  mandi: string;
  mandi_id: string;
  day_offset: number;
  date_str: string;
  net_realization: number;
  is_open: boolean;
  is_best: boolean;
  gain_vs_baseline: number;
  risk: 'GREEN' | 'YELLOW' | 'RED';
  modal_price: number;
}

export interface HeatmapMatrix {
  mandis: string[];
  days: string[];
  matrix: HeatmapCell[][];
}

export interface SlotSchema {
  commodity?: string | null;
  quantity?: number | null;
  quantity_unit: string;
  origin_text?: string | null;
  home_mandi?: string | null;
  target_mandi?: string | null;
  requested_wait_days?: number | null;
  risk_profile: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE';
  language: string;
  bag_weight_kg?: number | null;
  is_complete: boolean;
  missing_slots: string[];
  ambiguous_slots: string[];
}

export interface AssistRequest {
  session_id: string;
  message: string;
  language: 'mr-IN' | 'hi-IN' | 'en-IN';
  input_mode: 'text' | 'voice';
  context?: Record<string, any>;
  risk_profile_override?: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE';
}

export interface AssistResponse {
  session_id: string;
  request_id: string;
  assistant_text: string;
  decision_record?: DecisionRecord | null;
  warnings: string[];
  voice_available: boolean;
  spoken_summary?: string | null;
  fallback_path: 'NONE' | 'GROQ' | 'TEMPLATE';
  slots: SlotSchema;
  clarification_needed: boolean;
  prompt_for_clarification?: string | null;
}
