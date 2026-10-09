import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Database } from 'lucide-react';

interface Props {
  freshness: 'FRESH' | 'SLIGHTLY_STALE' | 'STALE_RED' | string;
  tradingDayAge?: number;
  source?: string;
  asOfDate?: string;
}

export const FreshnessBadge: React.FC<Props> = ({
  freshness,
  tradingDayAge = 0,
  source = 'data.gov.in',
  asOfDate = '09 Oct 2026'
}) => {
  if (freshness === 'STALE_RED' || tradingDayAge >= 3) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-xs">
        <AlertOctagon className="w-3.5 h-3.5 text-rose-700 animate-pulse" />
        <span>Stale (3+ sessions old) • Excluded from current decisions</span>
      </div>
    );
  }

  if (freshness === 'SLIGHTLY_STALE' || tradingDayAge === 2) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
        <span>Slightly Stale (2 sessions old) • Caution</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
      <span>Fresh • {source} • {asOfDate}</span>
    </div>
  );
};
