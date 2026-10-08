import React, { useState, useEffect } from 'react';
import { History, BarChart3, ShieldCheck, Calendar, Filter } from 'lucide-react';
import { PriceHistoryResponse } from '../types';
import { ApiClient } from '../api/client';

interface Props {
  commodity: string;
  mandi: string;
  labels: Record<string, string>;
}

export const HistoricalChartScreen: React.FC<Props> = ({ commodity, mandi, labels }) => {
  const [days, setDays] = useState<number>(30);
  const [history, setHistory] = useState<PriceHistoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    ApiClient.getPriceHistory(commodity, mandi, days)
      .then((data) => {
        if (isMounted) {
          setHistory(data);
          setSelectedPointIndex(data.series.length - 1);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('History fetch failed:', err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [commodity, mandi, days]);

  if (loading || !history) {
    return <div className="glass-panel p-8 text-center rounded-2xl text-slate-400">Loading {days}-day historical price trend...</div>;
  }

  const series = history.series;
  const maxPrice = Math.max(...series.map(s => s.max_price), 2200);
  const minPrice = Math.min(...series.map(s => s.min_price), 1100);
  const maxArrivals = Math.max(...series.map(s => s.arrivals), 250);

  const priceScale = (p: number) => ((p - minPrice) / (maxPrice - minPrice)) * 100;
  const arrivalScale = (a: number) => (a / maxArrivals) * 45; // max 45% height

  const selectedPoint = selectedPointIndex !== null && series[selectedPointIndex] ? series[selectedPointIndex] : series[series.length - 1];

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-agri-400" />
            <span>{days}-Day Historical Modal Trend & Arrivals ({mandi})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Confirmed daily market observations from {history.source}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Day window toggle: 30 vs 60 vs 90 */}
          <div className="bg-slate-900/90 rounded-lg p-0.5 border border-slate-800 text-xs flex">
            {[30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  days === d ? 'bg-agri-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {history.freshness}
          </span>
        </div>
      </div>

      {/* Selected Data Point Inspector Card */}
      {selectedPoint && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Observation Date</span>
            <span className="text-sm font-bold text-slate-100">{selectedPoint.date}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Modal Price</span>
            <span className="text-sm font-bold text-agri-400">₹{selectedPoint.modal_price} /qtl</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Min – Max Range</span>
            <span className="text-sm font-bold text-slate-200">₹{selectedPoint.min_price} – ₹{selectedPoint.max_price}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Arrivals Volume</span>
            <span className="text-sm font-bold text-blue-400">{selectedPoint.arrivals} tonnes</span>
          </div>
        </div>
      )}

      {/* Interactive Composite Chart (SVG + HTML Bars) */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400"></span>
              Modal Price (₹/qtl)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-emerald-500/10 border border-emerald-500/30 rounded-sm"></span>
              Min–Max Spread
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-500/40 rounded-sm"></span>
              Arrivals (Tonnes)
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Hover / tap points to inspect</span>
        </div>

        {/* Chart Viewport */}
        <div className="h-64 relative flex items-end justify-between gap-1 pt-6 pb-2 border-b border-slate-800">
          {series.map((pt, idx) => {
            const isSelected = selectedPointIndex === idx;
            const topModal = 100 - priceScale(pt.modal_price);
            const arrivalH = arrivalScale(pt.arrivals);
            const spreadTop = 100 - priceScale(pt.max_price);
            const spreadBottom = 100 - priceScale(pt.min_price);
            const spreadH = spreadBottom - spreadTop;

            return (
              <div
                key={idx}
                onClick={() => setSelectedPointIndex(idx)}
                onMouseEnter={() => setSelectedPointIndex(idx)}
                className="flex-1 h-full flex flex-col justify-end items-center relative group cursor-pointer"
              >
                {/* Arrival Bar overlay */}
                <div
                  className="w-full max-w-[8px] bg-blue-500/25 group-hover:bg-blue-500/50 rounded-t-sm transition-all"
                  style={{ height: `${arrivalH}%` }}
                ></div>

                {/* Min-Max Spread Band */}
                <div
                  className="absolute w-full max-w-[6px] bg-emerald-500/15 group-hover:bg-emerald-500/30 rounded-sm"
                  style={{ top: `${spreadTop}%`, height: `${spreadH}%` }}
                ></div>

                {/* Modal Price Dot */}
                <div
                  className={`absolute w-2 h-2 rounded-full transition-transform ${
                    isSelected ? 'bg-emerald-300 scale-150 ring-2 ring-emerald-500' : 'bg-emerald-400 group-hover:scale-125'
                  }`}
                  style={{ top: `${topModal}%` }}
                ></div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between text-[11px] text-slate-500 pt-1">
          <span>{series[0]?.date}</span>
          <span>Mid: {series[Math.floor(series.length / 2)]?.date}</span>
          <span>Latest: {series[series.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  );
};
