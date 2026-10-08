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
    <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-agri-400" />
            <span>3×7 Best-Day / Best-Mandi Decision Heatmap</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Risk-adjusted net realization (₹) across 3 verified Maharashtra mandis and 7 sale horizons.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-400"></span>
            Best Feasible Cell
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700"></span>
            Mandi Closed
          </span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-900/60 rounded-tl-xl">
                Mandi Name
              </th>
              {days.map((dayTitle, i) => (
                <th
                  key={i}
                  className="py-3 px-3 text-xs font-bold text-slate-300 text-center uppercase tracking-wider bg-slate-900/60"
                >
                  {dayTitle}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {mandis.map((mandiName, rowIdx) => {
              const rowCells = matrix[rowIdx] || [];
              return (
                <tr key={rowIdx} className="hover:bg-slate-900/30 transition">
                  <td className="py-4 px-4 font-semibold text-xs sm:text-sm text-slate-200 bg-slate-900/40">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-agri-400"></span>
                      <span>{mandiName}</span>
                    </div>
                  </td>
                  {rowCells.map((cell, colIdx) => {
                    const isBest = cell.is_best;
                    const isOpen = cell.is_open;

                    if (!isOpen) {
                      return (
                        <td key={colIdx} className="py-3 px-2 text-center">
                          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl py-3 px-2 opacity-50 cursor-not-allowed">
                            <span className="text-[11px] font-semibold text-slate-500 block">CLOSED</span>
                            <span className="text-[10px] text-slate-600 block">Weekly Off</span>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={colIdx} className="py-3 px-2 text-center">
                        <button
                          onClick={() => onSelectCell && onSelectCell(cell)}
                          className={`w-full py-3 px-2 rounded-xl transition transform active:scale-95 text-center ${
                            isBest
                              ? 'bg-gradient-to-b from-emerald-600/30 to-emerald-950/60 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20'
                              : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {isBest && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded-full mb-1">
                              <Award className="w-3 h-3 text-emerald-400" />
                              BEST
                            </span>
                          )}
                          <div className={`font-bold text-xs sm:text-sm ${isBest ? 'text-emerald-300 font-extrabold' : 'text-slate-200'}`}>
                            ₹{cell.net_realization.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {cell.gain_vs_baseline > 0 ? (
                              <span className="text-emerald-400">+{cell.gain_vs_baseline.toLocaleString('en-IN')}</span>
                            ) : cell.gain_vs_baseline < 0 ? (
                              <span className="text-rose-400">{cell.gain_vs_baseline.toLocaleString('en-IN')}</span>
                            ) : (
                              <span className="text-slate-400">Baseline</span>
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

      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-agri-400 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Invariant:</strong> All cell values reflect true risk-adjusted <em>net realization</em> after sequential holding loss, travel loss, transport trips, storage, and financing. Closed trading days are disabled and cannot be chosen as recommendations.
        </p>
      </div>
    </div>
  );
};
