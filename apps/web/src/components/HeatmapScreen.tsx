import React from 'react';
import { Calendar, Award, AlertCircle, CheckCircle2 } from 'lucide-react';
import { HeatmapMatrix, HeatmapCell } from '../types';

interface Props {
  heatmapData: HeatmapMatrix | null;
  onSelectCell?: (cell: HeatmapCell) => void;
  labels: Record<string, string>;
}

export const HeatmapScreen: React.FC<Props> = ({ heatmapData, onSelectCell, labels }) => {
  if (!heatmapData || !heatmapData.matrix || heatmapData.matrix.length === 0) {
    return (
      <div className="glass-panel p-8 text-center rounded-2xl text-slate-400">
        Loading 3×7 Best-Day / Best-Mandi Heatmap matrix...
      </div>
    );
  }

  const { mandis, days, matrix } = heatmapData;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-100 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            <span>3×7 Best-Day / Best-Mandi Decision Heatmap</span>
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Risk-adjusted net realization (₹) across 3 verified Maharashtra mandis and 7 sale horizons.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 border-2 border-emerald-600"></span>
            Best Feasible Cell
          </span>
          <span className="flex items-center gap-1.5 text-slate-500 font-medium">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-200 border border-slate-300"></span>
            Mandi Closed
          </span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto scrollbar-thin rounded-2xl border border-emerald-100">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-emerald-100 bg-emerald-50/80">
              <th className="py-3 px-4 text-xs font-black text-emerald-950 uppercase tracking-wider">
                Mandi Name
              </th>
              {days.map((dayTitle, i) => (
                <th
                  key={i}
                  className="py-3 px-3 text-xs font-black text-emerald-950 text-center uppercase tracking-wider"
                >
                  {dayTitle}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50 bg-white">
            {mandis.map((mandiName, rowIdx) => {
              const rowCells = matrix[rowIdx] || [];
              return (
                <tr key={rowIdx} className="hover:bg-emerald-50/40 transition">
                  <td className="py-4 px-4 font-bold text-xs sm:text-sm text-slate-900 bg-emerald-50/20">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      <span>{mandiName}</span>
                    </div>
                  </td>
                  {rowCells.map((cell, colIdx) => {
                    const isBest = cell.is_best;
                    const isOpen = cell.is_open;

                    if (!isOpen) {
                      return (
                        <td key={colIdx} className="py-3 px-2 text-center">
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl py-3 px-2 opacity-60 cursor-not-allowed">
                            <span className="text-[11px] font-bold text-slate-500 block">CLOSED</span>
                            <span className="text-[10px] text-slate-400 block font-medium">Weekly Off</span>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={colIdx} className="py-3 px-2 text-center">
                        <button
                          onClick={() => onSelectCell && onSelectCell(cell)}
                          className={`w-full py-3 px-2 rounded-2xl transition transform active:scale-95 text-center ${
                            isBest
                              ? 'bg-emerald-100/90 border-2 border-emerald-600 shadow-md text-emerald-950'
                              : 'bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                          }`}
                        >
                          {isBest && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded-full mb-1">
                              <Award className="w-3 h-3 text-emerald-700" />
                              BEST
                            </span>
                          )}
                          <div className={`font-black text-xs sm:text-sm ${isBest ? 'text-emerald-900' : 'text-slate-900'}`}>
                            ₹{cell.net_realization.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] font-bold mt-0.5">
                            {cell.gain_vs_baseline > 0 ? (
                              <span className="text-emerald-700 font-extrabold">+{cell.gain_vs_baseline.toLocaleString('en-IN')}</span>
                            ) : cell.gain_vs_baseline < 0 ? (
                              <span className="text-rose-600">{cell.gain_vs_baseline.toLocaleString('en-IN')}</span>
                            ) : (
                              <span className="text-slate-500">Baseline</span>
                            )}
                          </div>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-slate-800 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
        <p className="font-medium">
          <strong className="text-emerald-950">Invariant:</strong> All cell values reflect true risk-adjusted <em>net realization</em> after sequential holding loss, travel loss, transport trips, storage, and financing. Closed trading days are disabled and cannot be chosen as recommendations.
        </p>
      </div>
    </div>
  );
};
