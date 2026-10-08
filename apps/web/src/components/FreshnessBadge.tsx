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
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        <AlertOctagon className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
        <span>Stale (3+ sessions old) • Excluded from current decisions</span>
      </div>
    );
  }

  if (freshness === 'SLIGHTLY_STALE' || tradingDayAge === 2) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        <span>Slightly Stale (2 sessions old) • Caution</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      <span>Fresh • {source} • {asOfDate}</span>
    </div>
  );
};
