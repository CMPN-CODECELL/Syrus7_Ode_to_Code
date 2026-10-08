import React, { useState } from 'react';
import { Sliders, RefreshCw, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
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

  // Run on mount once if not yet computed
  React.useEffect(() => {
    if (!scenarioResult && record) {
      handleRunScenario();
    }
  }, [record]);

  if (!record) return null;

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-purple-400" />
            <span>Deterministic What-If Scenario Stress Testing</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Re-runs the canonical decision engine under market shocks without mutating historical data.
          </p>
        </div>

        <button
          onClick={handleRunScenario}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition transform active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Simulating Engine...' : 'Rerun Backend Scenario'}</span>
        </button>
      </div>

      {/* Interactive Controls Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 text-xs">
        {/* Price Delta Slider */}
        <div className="space-y-2">
          <div className="flex justify-between font-semibold">
            <span className="text-slate-300">Future Mandi Price Delta</span>
            <span className={priceDeltaPct < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
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
            className="w-full accent-purple-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Crash (-30%)</span>
            <span>Default (-10%)</span>
            <span>Surge (+30%)</span>
          </div>
        </div>

        {/* Transport Surge Slider */}
        <div className="space-y-2">
          <div className="flex justify-between font-semibold">
            <span className="text-slate-300">Transport & Diesel Cost Delta</span>
            <span className="text-amber-400 font-bold">
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
            className="w-full accent-purple-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Cheaper (-10%)</span>
            <span>Surge (+20%)</span>
            <span>Crisis (+50%)</span>
          </div>
        </div>

        {/* Arrival Volume Multiplier Slider */}
        <div className="space-y-2">
          <div className="flex justify-between font-semibold">
            <span className="text-slate-300">Arrivals Surge Multiplier</span>
            <span className={arrivalMultiplier > 1.5 ? 'text-rose-400 font-bold' : 'text-slate-200 font-bold'}>
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
            className="w-full accent-purple-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
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
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm block mb-0.5 text-amber-200">
                  Decision Recommendation Flips!
                </span>
                <p>{scenarioResult.summary}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="font-bold block text-emerald-200">Recommendation Resilient</span>
                <p>{scenarioResult.summary}</p>
              </div>
            </div>
          )}

          {/* Before vs After Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm divide-y divide-slate-800">
              <thead>
                <tr className="text-slate-400 font-bold uppercase text-[11px] tracking-wider bg-slate-900/50">
                  <th className="py-3 px-4">Metric</th>
                  <th className="py-3 px-4">Baseline Recommendation</th>
                  <th className="py-3 px-4 text-purple-300 font-bold">Stressed Scenario</th>
                  <th className="py-3 px-4 text-right">Net Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {scenarioResult.comparison_table.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 text-slate-200 font-semibold">{row.metric}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono">{row.baseline_value}</td>
                    <td className="py-3 px-4 text-purple-300 font-mono font-bold">{row.scenario_value}</td>
                    <td className={`py-3 px-4 text-right font-bold ${
                      row.impact === 'NEGATIVE' ? 'text-rose-400' : row.impact === 'POSITIVE' ? 'text-emerald-400' : 'text-slate-400'
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
