import React from 'react';
import { Receipt, Truck, Box, Percent, Scale, ShieldCheck, HelpCircle } from 'lucide-react';
import { DecisionRecord, CostBreakdown } from '../types';

interface Props {
  record: DecisionRecord | null;
  labels: Record<string, string>;
}

export const CostScreen: React.FC<Props> = ({ record, labels }) => {
  if (!record) return null;

  const cb: CostBreakdown = record.chosen.cost_breakdown;
  const initialQty = cb.quantity_initial_qtl;
  const soldQty = cb.quantity_sold_qtl;
  const holdingLoss = cb.holding_loss_pct * 100;
  const travelLoss = cb.travel_loss_pct * 100;

  const totalDeductions = cb.transport + cb.hamali_tolai + cb.commission_fees + cb.storage + cb.financing;

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-400" />
            <span>Canonical Logistics & Cost Breakdown</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Reconciles gross produce revenue to final net realization. Invariant: zero double-spoilage deductions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            cost_config_v1.0
          </span>
        </div>
      </div>

      {/* Sequential Loss Waterfall (Quantity) */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-agri-400" />
          <span>Sequential Perishability Loss Cascade</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">1. Harvest Lot Quantity</span>
            <span className="text-base font-bold text-slate-100">{initialQty} qtl</span>
            <span className="text-[10px] text-slate-500 block">Initial weight at farmgate</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">2. After Holding Loss ({holdingLoss.toFixed(1)}%)</span>
            <span className="text-base font-bold text-amber-400">
              {(initialQty * (1 - cb.holding_loss_pct)).toFixed(3)} qtl
            </span>
            <span className="text-[10px] text-slate-500 block">2-day respiration & moisture loss</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">3. Final Saleable Weight ({travelLoss.toFixed(1)}% transit)</span>
            <span className="text-base font-bold text-emerald-400">{soldQty} qtl</span>
            <span className="text-[10px] text-slate-500 block">Net weighed at mandi weighbridge</span>
          </div>
        </div>
      </div>

      {/* Itemized Monetary Deductions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm divide-y divide-slate-800">
          <thead>
            <tr className="text-slate-400 font-bold uppercase text-[11px] tracking-wider bg-slate-900/50">
              <th className="py-3 px-4">Cost Component</th>
              <th className="py-3 px-4">Formula / Basis</th>
              <th className="py-3 px-4 text-center">Provenance</th>
              <th className="py-3 px-4 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            <tr className="bg-emerald-950/20 text-emerald-300 font-bold">
              <td className="py-3.5 px-4 flex items-center gap-2">
                <Box className="w-4 h-4 text-emerald-400" />
                Gross Realized Revenue
              </td>
              <td className="py-3.5 px-4 font-mono text-xs">
                {soldQty} qtl × ₹{record.chosen.modal_price_expected}/qtl
              </td>
              <td className="py-3.5 px-4 text-center">
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Deterministic</span>
              </td>
              <td className="py-3.5 px-4 text-right text-base">
                ₹{cb.gross_revenue.toLocaleString('en-IN')}
              </td>
            </tr>

            <tr className="hover:bg-slate-900/40">
              <td className="py-3 px-4 flex items-center gap-2 text-slate-200">
                <Truck className="w-4 h-4 text-blue-400" />
                Transport & Freight
              </td>
              <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                ₹12/km × 60 km × 2.0 (round-trip) × 1 trip
              </td>
              <td className="py-3 px-4 text-center">
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Verified Rate</span>
              </td>
              <td className="py-3 px-4 text-right text-rose-400 font-mono">
                -₹{cb.transport.toLocaleString('en-IN')}
              </td>
            </tr>

            <tr className="hover:bg-slate-900/40">
              <td className="py-3 px-4 text-slate-200">Hamali / Weighment (Tolai)</td>
              <td className="py-3 px-4 text-slate-400 font-mono text-xs">₹12.0/qtl × {initialQty} qtl</td>
              <td className="py-3 px-4 text-center">
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">APMC By-law</span>
              </td>
              <td className="py-3 px-4 text-right text-rose-400 font-mono">
                -₹{cb.hamali_tolai.toLocaleString('en-IN')}
              </td>
            </tr>

            <tr className="hover:bg-slate-900/40">
              <td className="py-3 px-4 text-slate-200">Holding Storage Cost</td>
              <td className="py-3 px-4 text-slate-400 font-mono text-xs">₹2.0/qtl/day × {initialQty} qtl × {record.chosen.wait_days} days</td>
              <td className="py-3 px-4 text-center">
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">Assumption</span>
              </td>
              <td className="py-3 px-4 text-right text-rose-400 font-mono">
                -₹{cb.storage.toLocaleString('en-IN')}
              </td>
            </tr>

            <tr className="hover:bg-slate-900/40">
              <td className="py-3 px-4 text-slate-200">Capital Financing Cost (Opportunity)</td>
              <td className="py-3 px-4 text-slate-400 font-mono text-xs">12% annual rate on capital tied up × {record.chosen.wait_days}d / 365</td>
              <td className="py-3 px-4 text-center">
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">Assumption</span>
              </td>
              <td className="py-3 px-4 text-right text-rose-400 font-mono">
                -₹{cb.financing.toLocaleString('en-IN')}
              </td>
            </tr>

            <tr className="bg-slate-900/90 text-slate-200 font-bold border-t-2 border-slate-700">
              <td className="py-3.5 px-4">Total Deductions</td>
              <td className="py-3.5 px-4 text-slate-400 text-xs">Freight + Labor + Storage + Financing</td>
              <td className="py-3.5 px-4 text-center"></td>
              <td className="py-3.5 px-4 text-right text-rose-400 text-base font-mono">
                -₹{totalDeductions.toLocaleString('en-IN')}
              </td>
            </tr>

            <tr className="bg-gradient-to-r from-emerald-950/60 to-slate-900 text-white font-extrabold text-base border-t-2 border-emerald-500">
              <td className="py-4 px-4 text-emerald-300">
                Final Net Realization (In Hand)
              </td>
              <td className="py-4 px-4 text-emerald-200 text-xs font-normal">
                Gross Revenue − Total Deductions
              </td>
              <td className="py-4 px-4 text-center">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400">
                  Authority Net
                </span>
              </td>
              <td className="py-4 px-4 text-right text-emerald-300 text-xl font-black">
                ₹{cb.final_net.toLocaleString('en-IN')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
