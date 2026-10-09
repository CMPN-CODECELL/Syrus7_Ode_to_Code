import React, { useState } from 'react';
import { X, Check, Sprout, MapPin, Scale, Shield, Calendar, Truck } from 'lucide-react';
import { SlotSchema } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentSlots: SlotSchema;
  onSave: (updatedSlots: SlotSchema) => void;
  labels: Record<string, string>;
}

export const FarmerInputsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentSlots,
  onSave,
  labels
}) => {
  const [commodity, setCommodity] = useState(currentSlots.commodity || 'Tomato');
  const [quantity, setQuantity] = useState(currentSlots.quantity || 20.0);
  const [unit, setUnit] = useState(currentSlots.quantity_unit || 'qtl');
  const [homeMandi, setHomeMandi] = useState(currentSlots.home_mandi || 'Nashik APMC');
  const [riskProfile, setRiskProfile] = useState<'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE'>(currentSlots.risk_profile || 'BALANCED');
  const [waitDays, setWaitDays] = useState(currentSlots.requested_wait_days || 2);
  const [bagWeightKg, setBagWeightKg] = useState(currentSlots.bag_weight_kg || 50);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...currentSlots,
      commodity,
      quantity: Number(quantity),
      quantity_unit: unit,
      home_mandi: homeMandi,
      risk_profile: riskProfile,
      requested_wait_days: Number(waitDays),
      bag_weight_kg: unit === 'bag' ? Number(bagWeightKg) : undefined,
      is_complete: true,
      missing_slots: []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-black text-slate-900">Farmer Lot & Selling Parameters</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Commodity & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-800 font-bold flex items-center gap-1">
                <span>Commodity (पीक)</span>
              </label>
              <select
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-900 font-semibold focus:border-emerald-600 focus:bg-white focus:outline-none"
              >
                <option value="Tomato">Tomato (टोमॅटो)</option>
                <option value="Onion">Onion (कांदा)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-800 font-bold flex items-center gap-1">
                <span>Quantity & Unit</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="w-2/3 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-900 font-bold focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-1/3 bg-slate-50 border border-slate-200 rounded-2xl px-2 py-2.5 text-slate-900 font-semibold focus:border-emerald-600 focus:bg-white focus:outline-none"
                >
                  <option value="qtl">Quintal</option>
                  <option value="tonne">Tonne</option>
                  <option value="bag">Bag (पोतं)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bag Weight if bag selected */}
          {unit === 'bag' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
              <label className="text-amber-900 font-bold text-xs">
                Bag Weight (kg per bag) — Required Invariant
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={bagWeightKg}
                onChange={(e) => setBagWeightKg(parseFloat(e.target.value) || 50)}
                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs"
                placeholder="e.g. 50 kg"
              />
            </div>
          )}

          {/* Mandi & Wait Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-800 font-bold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Home Mandi (स्थानिक बाजार)</span>
              </label>
              <select
                value={homeMandi}
                onChange={(e) => setHomeMandi(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-900 font-semibold focus:border-emerald-600 focus:bg-white focus:outline-none"
              >
                <option value="Nashik APMC">Nashik APMC (Home Baseline)</option>
                <option value="Pimpalgaon Baswant APMC">Pimpalgaon Baswant APMC</option>
                <option value="Lasalgaon APMC">Lasalgaon APMC</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-800 font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>Wait Horizon</span>
              </label>
              <select
                value={waitDays}
                onChange={(e) => setWaitDays(parseInt(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-900 font-semibold focus:border-emerald-600 focus:bg-white focus:outline-none"
              >
                <option value={1}>1 Day (+1d)</option>
                <option value={2}>2 Days (+2d Recommended)</option>
                <option value={3}>3 Days (+3d)</option>
                <option value={4}>4 Days (+4d)</option>
              </select>
            </div>
          </div>

          {/* Risk Profile */}
          <div className="space-y-1.5">
            <label className="text-slate-800 font-bold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Farmer Risk Appetite</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['CAUTIOUS', 'BALANCED', 'AGGRESSIVE'] as const).map((prof) => (
                <button
                  key={prof}
                  type="button"
                  onClick={() => setRiskProfile(prof)}
                  className={`py-2 px-3 rounded-2xl border text-xs font-bold transition ${
                    riskProfile === prof
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {prof === 'CAUTIOUS' ? 'Cautious (q20)' : prof === 'BALANCED' ? 'Balanced (q35)' : 'Aggressive (q50)'}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-emerald-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black transition text-xs shadow-md shadow-emerald-700/25"
            >
              Update & Recalculate Decision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
