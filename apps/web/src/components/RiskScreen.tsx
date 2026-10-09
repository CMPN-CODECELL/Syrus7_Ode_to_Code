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
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            GREEN (0.0)
          </span>
        );
      case 'YELLOW':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            YELLOW (0.5)
          </span>
        );
      case 'RED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <AlertOctagon className="w-3.5 h-3.5" />
            RED (1.0)
          </span>
        );
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-100 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            <span>Deterministic Six-Risk Engine Evaluation</span>
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Weighted composite: 0.25 Price Drop + 0.20 Arrival Spike + 0.15 Volatility + 0.15 Stale + 0.15 Forecast + 0.10 Weather.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-500 font-semibold block">Composite Score</span>
            <span className="text-lg font-mono font-black text-slate-900">{risk.score.toFixed(2)}</span>
          </div>
          <div className={`px-4 py-2 rounded-2xl text-xs font-black uppercase border ${
            risk.overall === 'GREEN'
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
              : risk.overall === 'YELLOW'
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-rose-100 text-rose-900 border-rose-300'
          }`}>
            OVERALL {risk.overall}
          </div>
        </div>
      </div>

      {/* Safety Override Notice if applicable */}
      {risk.safety_override && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2 font-medium">
          <AlertOctagon className="w-5 h-5 text-rose-700 flex-shrink-0" />
          <span><strong className="font-black">Safety Override Active:</strong> {risk.safety_override}</span>
        </div>
      )}

      {/* Six Risk Flags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {risk.flags.map((flag: RiskFlag) => (
          <div
            key={flag.id}
            className={`p-5 rounded-3xl border transition-all space-y-3 ${
              flag.status === 'RED'
                ? 'bg-rose-50/70 border-rose-200 shadow-xs'
                : flag.status === 'YELLOW'
                ? 'bg-amber-50/70 border-amber-200 shadow-xs'
                : 'bg-emerald-50/40 border-emerald-100 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-slate-900">{flag.name}</span>
              {getStatusBadge(flag.status)}
            </div>

            <div className="text-xs text-slate-700 leading-relaxed font-medium">
              <span className="text-slate-500 block text-[11px] font-bold">Evaluation Reason:</span>
              <p>{flag.reason}</p>
            </div>

            <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 font-medium">
              <span className="font-bold text-slate-900">Evidence: </span>
              {flag.evidence}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
