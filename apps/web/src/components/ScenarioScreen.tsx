import React, { useState } from 'react';
import { Sliders, RefreshCw, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';
import { DecisionRecord, ScenarioResponse } from '../types';
import { ApiClient } from '../api/client';

interface Props {
  record: DecisionRecord | null;
  labels: Record<string, string>;
}

export const ScenarioScreen: React.FC<Props> = ({ record, labels }) => {
  const [priceDeltaPct, setPriceDeltaPct] = useState<number>(-0.10); // -10% default
  const [transportDeltaPct, setTransportDeltaPct] = useState<number>(0.20); // +20% default
  const [arrivalMultiplier, setArrivalMultiplier] = useState<number>(2.0); // 2.0x default
  const [loading, setLoading] = useState<boolean>(false);
  const [scenarioResult, setScenarioResult] = useState<ScenarioResponse | null>(null);

  const handleRunScenario = async () => {
    if (!record) return;
    setLoading(true);
    try {
      const res = await ApiClient.runScenario({
        base_request_id: record.request_id,
        commodity: record.commodity,
        quantity_qtl: record.lot_quantity_qtl,
        home_mandi: record.chosen.market,
        price_delta_pct: priceDeltaPct,
        transport_delta_pct: transportDeltaPct,
        arrival_multiplier: arrivalMultiplier,
        risk_profile: record.risk_profile
      });
      setScenarioResult(res);
    } catch (e) {
      console.error('Scenario simulation failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const triggerCustomScenario = async (pDelta: number, tDelta: number, aMult: number) => {
    if (!record) return;
    setPriceDeltaPct(pDelta);
    setTransportDeltaPct(tDelta);
    setArrivalMultiplier(aMult);
    setLoading(true);
    try {
      const res = await ApiClient.runScenario({
        base_request_id: record.request_id,
        commodity: record.commodity,
        quantity_qtl: record.lot_quantity_qtl,
        home_mandi: record.chosen.market,
        price_delta_pct: pDelta,
        transport_delta_pct: tDelta,
        arrival_multiplier: aMult,
        risk_profile: record.risk_profile
      });
      setScenarioResult(res);
    } catch (e) {
      console.error('Scenario simulation failed:', e);
    } finally {
      setLoading(false);
    }
  };

  // Run on mount once if not yet computed
  React.useEffect(() => {
    if (!scenarioResult && record) {
      handleRunScenario();
    }
  }, [record]);

  if (!record) return null;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-100 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-emerald-600" />
            <span>Deterministic What-If Scenario Stress Testing</span>
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Re-runs the canonical decision engine under market shocks without mutating historical data.
          </p>
        </div>

        <button
          onClick={handleRunScenario}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition transform active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Simulating Engine...' : 'Rerun Backend Scenario'}</span>
        </button>
      </div>

      {/* 1-Click Stress Test Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>एक-क्लिक ताण चाचणी (1-Click Stress Test Presets):</span>
          </span>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            झटपट परिणाम पाहण्यासाठी क्लिक करा
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => triggerCustomScenario(0, 0.20, 1.0)}
            className="p-3 rounded-2xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-left transition shadow-xs text-xs"
          >
            <span className="font-extrabold text-amber-900 block text-[11px]">🚛 +20% वाहतूक वाढ</span>
            <span className="text-[10px] text-slate-600 font-medium">इंधन दरवाढ प्रभाव</span>
          </button>

          <button
            onClick={() => triggerCustomScenario(-0.10, 0, 1.0)}
            className="p-3 rounded-2xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-left transition shadow-xs text-xs"
          >
            <span className="font-extrabold text-rose-900 block text-[11px]">📉 -10% भाव घसरण</span>
            <span className="text-[10px] text-slate-600 font-medium">अपेक्षित भाव पडल्यास</span>
          </button>

          <button
            onClick={() => triggerCustomScenario(0, 0, 2.0)}
            className="p-3 rounded-2xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-left transition shadow-xs text-xs"
          >
            <span className="font-extrabold text-blue-900 block text-[11px]">🌾 2.0x दुप्पट आवक</span>
            <span className="text-[10px] text-slate-600 font-medium">बाजारात प्रचंड माल आल्यास</span>
          </button>

          <button
            onClick={() => triggerCustomScenario(0, 0, 1.0)}
            className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-left transition shadow-xs text-xs"
          >
            <span className="font-extrabold text-emerald-900 block text-[11px]">🔄 मूळ स्थिती (Reset)</span>
            <span className="text-[10px] text-slate-600 font-medium">सामान्य बाजार परिस्थिती</span>
          </button>
        </div>
      </div>

      {/* Interactive Controls Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100 text-xs">
        {/* Price Delta Slider */}
        <div className="space-y-2 bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <div className="flex justify-between font-bold">
            <span className="text-slate-800">Future Mandi Price Delta</span>
            <span className={priceDeltaPct < 0 ? 'text-rose-700 font-black' : 'text-emerald-700 font-black'}>
              {priceDeltaPct > 0 ? `+${(priceDeltaPct * 100).toFixed(0)}%` : `${(priceDeltaPct * 100).toFixed(0)}%`}
            </span>
          </div>
          <input
            type="range"
            min="-0.30"
            max="0.30"
            step="0.05"
            value={priceDeltaPct}
            onChange={(e) => setPriceDeltaPct(parseFloat(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
            <span>Crash (-30%)</span>
            <span>Default (-10%)</span>
            <span>Surge (+30%)</span>
          </div>
        </div>

        {/* Transport Surge Slider */}
        <div className="space-y-2 bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <div className="flex justify-between font-bold">
            <span className="text-slate-800">Transport & Diesel Cost Delta</span>
            <span className="text-amber-700 font-black">
              {transportDeltaPct > 0 ? `+${(transportDeltaPct * 100).toFixed(0)}%` : `${(transportDeltaPct * 100).toFixed(0)}%`}
            </span>
          </div>
          <input
            type="range"
            min="-0.10"
            max="0.50"
            step="0.05"
            value={transportDeltaPct}
            onChange={(e) => setTransportDeltaPct(parseFloat(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
            <span>Cheaper (-10%)</span>
            <span>Surge (+20%)</span>
            <span>Crisis (+50%)</span>
          </div>
        </div>

        {/* Arrival Volume Multiplier Slider */}
        <div className="space-y-2 bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <div className="flex justify-between font-bold">
            <span className="text-slate-800">Arrivals Surge Multiplier</span>
            <span className={arrivalMultiplier > 1.5 ? 'text-rose-700 font-black' : 'text-slate-900 font-black'}>
              {arrivalMultiplier.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.5"
            value={arrivalMultiplier}
            onChange={(e) => setArrivalMultiplier(parseFloat(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
            <span>Low (0.5x)</span>
            <span>Normal (1.0x)</span>
            <span>Surge Glut (2.0x+)</span>
          </div>
        </div>
      </div>

      {/* Scenario Result Presentation */}
      {scenarioResult && (
        <div className="space-y-4">
          {/* Action Flip Alert Banner */}
          {scenarioResult.action_flipped ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-sm block mb-0.5 text-amber-900">
                  Decision Recommendation Flips!
                </span>
                <p className="font-medium">{scenarioResult.summary}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-black block text-emerald-900">Recommendation Resilient</span>
                <p className="font-medium">{scenarioResult.summary}</p>
              </div>
            </div>
          )}

          {/* Before vs After Comparison Table */}
          <div className="overflow-x-auto rounded-2xl border border-emerald-100">
            <table className="w-full text-left text-xs sm:text-sm divide-y divide-emerald-100">
              <thead>
                <tr className="text-emerald-950 font-black uppercase text-[11px] tracking-wider bg-emerald-50/80">
                  <th className="py-3 px-4">Metric</th>
                  <th className="py-3 px-4">Baseline Recommendation</th>
                  <th className="py-3 px-4 text-emerald-800 font-black">Stressed Scenario</th>
                  <th className="py-3 px-4 text-right">Net Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium">
                {scenarioResult.comparison_table.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-900 font-bold">{row.metric}</td>
                    <td className="py-3 px-4 text-slate-700 font-mono">{row.baseline_value}</td>
                    <td className="py-3 px-4 text-emerald-900 font-mono font-black">{row.scenario_value}</td>
                    <td className={`py-3 px-4 text-right font-black ${
                      row.impact === 'NEGATIVE' ? 'text-rose-700' : row.impact === 'POSITIVE' ? 'text-emerald-700' : 'text-slate-600'
                    }`}>
                      {row.difference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
