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
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-100 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            <span>Canonical Logistics & Cost Breakdown</span>
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Reconciles gross produce revenue to final net realization. Invariant: zero double-spoilage deductions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            cost_config_v1.0
          </span>
        </div>
      </div>

      {/* Sequential Loss Waterfall (Quantity) */}
      <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-200 space-y-3">
        <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-emerald-700" />
          <span>Sequential Perishability Loss Cascade</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white border border-emerald-100 shadow-xs">
            <span className="text-slate-500 block text-[11px] font-semibold">1. Harvest Lot Quantity</span>
            <span className="text-base font-black text-slate-900">{initialQty} qtl</span>
            <span className="text-[10px] text-slate-500 block font-medium">Initial weight at farmgate</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-emerald-100 shadow-xs">
            <span className="text-slate-500 block text-[11px] font-semibold">2. After Holding Loss ({holdingLoss.toFixed(1)}%)</span>
            <span className="text-base font-black text-amber-700">
              {(initialQty * (1 - cb.holding_loss_pct)).toFixed(3)} qtl
            </span>
            <span className="text-[10px] text-slate-500 block font-medium">2-day respiration & moisture loss</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-emerald-100 shadow-xs">
            <span className="text-slate-500 block text-[11px] font-semibold">3. Final Saleable Weight ({travelLoss.toFixed(1)}% transit)</span>
            <span className="text-base font-black text-emerald-800">{soldQty} qtl</span>
            <span className="text-[10px] text-slate-500 block font-medium">Net weighed at mandi weighbridge</span>
          </div>
        </div>
      </div>

      {/* Itemized Monetary Deductions Table */}
      <div className="overflow-x-auto rounded-2xl border border-emerald-100">
        <table className="w-full text-left text-xs sm:text-sm divide-y divide-emerald-100">
          <thead>
            <tr className="text-emerald-950 font-black uppercase text-[11px] tracking-wider bg-emerald-50/80">
              <th className="py-3 px-4">Cost Component</th>
              <th className="py-3 px-4">Formula / Basis</th>
              <th className="py-3 px-4 text-center">Provenance</th>
              <th className="py-3 px-4 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-medium">
            <tr className="bg-emerald-50/40 text-emerald-950 font-bold">
              <td className="py-3.5 px-4 flex items-center gap-2">
                <Box className="w-4 h-4 text-emerald-700" />
                Gross Realized Revenue
              </td>
              <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                {soldQty} qtl × ₹{record.chosen.modal_price_expected}/qtl
              </td>
              <td className="py-3.5 px-4 text-center">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Deterministic</span>
              </td>
              <td className="py-3.5 px-4 text-right text-base font-black text-emerald-900">
                ₹{cb.gross_revenue.toLocaleString('en-IN')}
              </td>
            </tr>

            <tr className="hover:bg-slate-50">
              <td className="py-3 px-4 flex items-center gap-2 text-slate-800 font-semibold">
                <Truck className="w-4 h-4 text-blue-600" />
                Transport & Freight
              </td>
              <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                ₹12/km × 60 km × 2.0 (round-trip) × 1 trip
              </td>
              <td className="py-3 px-4 text-center">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">Verified Rate</span>
              </td>
              <td className="py-3 px-4 text-right text-rose-700 font-mono font-bold">
                -₹{cb.transport.toLocaleString('en-IN')}
              </td>
            </tr>

            <tr className="hover:bg-slate-50">
              <td className="py-3 px-4 text-slate-800 font-semibold">Hamali / Weighment (Tolai)</td>
              <td className="py-3 px-4 text-slate-600 font-mono text-xs">₹12.0/qtl × {initialQty} qtl</td>
              <td className="py-3 px-4 text-center">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">APMC By-law</span>
              </td>
              <td className="py-3 px-4 text-right text-rose-700 font-mono font-bold">
                -₹{cb.hamali_tolai.toLocaleString('en-IN')}
              </td>
            </tr>

            <tr className="hover:bg-slate-50">
              <td className="py-3 px-4 text-slate-800 font-semibold">Holding Storage Cost</td>
              <td className="py-3 px-4 text-slate-600 font-mono text-xs">₹2.0/qtl/day × {initialQty} qtl × {record.chosen.wait_days} days</td>
              <td className="py-3 px-4 text-center">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">Assumption</span>
              </td>
              <td className="py-3 px-4 text-right text-rose-700 font-mono font-bold">
                -₹{cb.storage.toLocaleString('en-IN')}
              </td>
            </tr>

            <tr className="hover:bg-slate-50">
              <td className="py-3 px-4 text-slate-800 font-semibold">Capital Financing Cost (Opportunity)</td>
              <td className="py-3 px-4 text-slate-600 font-mono text-xs">12% annual rate on capital tied up × {record.chosen.wait_days}d / 365</td>
              <td className="py-3 px-4 text-center">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">Assumption</span>
              </td>
              <td className="py-3 px-4 text-right text-rose-700 font-mono font-bold">
                -₹{cb.financing.toLocaleString('en-IN')}
              </td>
            </tr>

            <tr className="bg-slate-50 text-slate-900 font-black border-t-2 border-slate-200">
              <td className="py-3.5 px-4">Total Deductions</td>
              <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">Freight + Labor + Storage + Financing</td>
              <td className="py-3.5 px-4 text-center"></td>
              <td className="py-3.5 px-4 text-right text-rose-700 text-base font-mono">
                -₹{totalDeductions.toLocaleString('en-IN')}
              </td>
            </tr>

            <tr className="bg-emerald-700 text-white font-extrabold text-base border-t-2 border-emerald-800">
              <td className="py-4 px-4 text-white font-black">
                Final Net Realization (In Hand)
              </td>
              <td className="py-4 px-4 text-emerald-100 text-xs font-semibold">
                Gross Revenue − Total Deductions
              </td>
              <td className="py-4 px-4 text-center">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/40">
                  Authority Net
                </span>
              </td>
              <td className="py-4 px-4 text-right text-white text-xl font-black">
                ₹{cb.final_net.toLocaleString('en-IN')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
