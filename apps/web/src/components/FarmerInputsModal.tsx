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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-agri-400" />
            <h3 className="text-lg font-bold text-slate-100">Farmer Lot & Selling Parameters</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Commodity & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold flex items-center gap-1">
                <span>Commodity (पीक)</span>
              </label>
              <select
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:border-agri-500 focus:outline-none"
              >
                <option value="Tomato">Tomato (टोमॅटो)</option>
                <option value="Onion">Onion (कांदा)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold flex items-center gap-1">
                <span>Quantity & Unit</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="w-2/3 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:border-agri-500 focus:outline-none"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-1/3 bg-slate-900 border border-slate-800 rounded-xl px-2 py-2.5 text-slate-100 focus:border-agri-500 focus:outline-none"
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
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <label className="text-amber-300 font-semibold text-xs">
                Bag Weight (kg per bag) — Required Invariant
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={bagWeightKg}
                onChange={(e) => setBagWeightKg(parseFloat(e.target.value) || 50)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs"
                placeholder="e.g. 50 kg"
              />
            </div>
          )}

          {/* Mandi & Wait Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-agri-400" />
                <span>Home Mandi (स्थानिक बाजार)</span>
              </label>
              <select
                value={homeMandi}
                onChange={(e) => setHomeMandi(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:border-agri-500 focus:outline-none"
              >
                <option value="Nashik APMC">Nashik APMC (Home Baseline)</option>
                <option value="Pimpalgaon Baswant APMC">Pimpalgaon Baswant APMC</option>
                <option value="Lasalgaon APMC">Lasalgaon APMC</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                <span>Wait Horizon</span>
              </label>
              <select
                value={waitDays}
                onChange={(e) => setWaitDays(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:border-agri-500 focus:outline-none"
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
            <label className="text-slate-300 font-semibold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Farmer Risk Appetite</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['CAUTIOUS', 'BALANCED', 'AGGRESSIVE'] as const).map((prof) => (
                <button
                  key={prof}
                  type="button"
                  onClick={() => setRiskProfile(prof)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    riskProfile === prof
                      ? 'bg-agri-600 text-white border-agri-500 shadow-md shadow-agri-600/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  {prof === 'CAUTIOUS' ? 'Cautious (q20)' : prof === 'BALANCED' ? 'Balanced (q35)' : 'Aggressive (q50)'}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-agri-600 hover:bg-agri-500 text-white font-bold transition text-xs shadow-lg shadow-agri-600/30"
            >
              Update & Recalculate Decision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
