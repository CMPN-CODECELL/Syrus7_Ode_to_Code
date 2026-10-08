import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { RiskPayload, RiskFlag } from '../types';

interface Props {
  risk: RiskPayload | null;
  labels: Record<string, string>;
}

export const RiskScreen: React.FC<Props> = ({ risk, labels }) => {
  if (!risk) return null;

  const getStatusBadge = (status: 'GREEN' | 'YELLOW' | 'RED') => {
    switch (status) {
      case 'GREEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            GREEN (0.0)
          </span>
        );
      case 'YELLOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            YELLOW (0.5)
          </span>
        );
      case 'RED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertOctagon className="w-3.5 h-3.5" />
            RED (1.0)
          </span>
        );
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <span>Deterministic Six-Risk Engine Evaluation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Weighted composite: 0.25 Price Drop + 0.20 Arrival Spike + 0.15 Volatility + 0.15 Stale + 0.15 Forecast + 0.10 Weather.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Composite Score</span>
            <span className="text-lg font-mono font-bold text-slate-100">{risk.score.toFixed(2)}</span>
          </div>
          <div className={`px-4 py-2 rounded-2xl text-sm font-extrabold uppercase border ${
            risk.overall === 'GREEN'
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : risk.overall === 'YELLOW'
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
          }`}>
            OVERALL {risk.overall}
          </div>
        </div>
      </div>

      {/* Safety Override Notice if applicable */}
      {risk.safety_override && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span><strong>Safety Override Active:</strong> {risk.safety_override}</span>
        </div>
      )}

      {/* Six Risk Flags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {risk.flags.map((flag: RiskFlag) => (
          <div
            key={flag.id}
            className={`p-5 rounded-2xl border transition-all space-y-3 ${
              flag.status === 'RED'
                ? 'bg-rose-950/20 border-rose-500/30'
                : flag.status === 'YELLOW'
                ? 'bg-amber-950/15 border-amber-500/30'
                : 'bg-slate-900/70 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-200">{flag.name}</span>
              {getStatusBadge(flag.status)}
            </div>

            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="text-slate-400 block text-[11px] font-semibold">Evaluation Reason:</span>
              <p>{flag.reason}</p>
            </div>

            <div className="text-[11px] text-slate-400 bg-black/30 p-2.5 rounded-xl border border-white/5">
              <span className="font-semibold text-slate-300">Evidence: </span>
              {flag.evidence}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
