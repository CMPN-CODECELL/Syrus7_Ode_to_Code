import React, { useState } from 'react';
import { X, Check, Sprout, MapPin, Scale, Shield, Calendar, Truck } from 'lucide-react';
import { SlotSchema, SupportedLanguage } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentSlots: SlotSchema;
  onSave: (updatedSlots: SlotSchema) => void;
  labels: Record<string, string>;
  language?: SupportedLanguage;
}

export const FarmerInputsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentSlots,
  onSave,
  labels,
  language = 'en-IN'
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
            <h3 className="text-lg font-black text-slate-900">
              {language === 'mr-IN' ? 'शेतमाल व विक्री नियोजन तपशील' : 'Farmer Lot & Selling Parameters'}
            </h3>
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
                <span>{language === 'mr-IN' ? 'शेतीमाल / पीक' : 'Commodity / Crop'}</span>
              </label>
              <select
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-900 font-semibold focus:border-emerald-600 focus:bg-white focus:outline-none"
              >
                <option value="Tomato">{language === 'mr-IN' ? 'टोमॅटो' : 'Tomato'}</option>
                <option value="Onion">{language === 'mr-IN' ? 'कांदा' : 'Onion'}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-800 font-bold flex items-center gap-1">
                <span>{language === 'mr-IN' ? 'उत्पादन प्रमाण व एकक' : 'Quantity & Unit'}</span>
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
                  <option value="qtl">{language === 'mr-IN' ? 'क्विंटल' : 'Quintal'}</option>
                  <option value="tonne">{language === 'mr-IN' ? 'टन' : 'Tonne'}</option>
                  <option value="bag">{language === 'mr-IN' ? 'पोते' : 'Bag'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bag Weight if bag selected */}
          {unit === 'bag' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
              <label className="text-amber-900 font-bold text-xs">
                {language === 'mr-IN' ? 'पोत्याचे वजन (किलो प्रति पोते)' : 'Bag Weight (kg per bag) — Required Invariant'}
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={bagWeightKg}
                onChange={(e) => setBagWeightKg(parseFloat(e.target.value) || 50)}
                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs"
                placeholder={language === 'mr-IN' ? 'उदा. ५० किलो' : 'e.g. 50 kg'}
              />
            </div>
          )}

          {/* Mandi & Wait Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-800 font-bold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'mr-IN' ? 'स्थानिक बाजार समिती' : 'Home Mandi'}</span>
              </label>
              <select
                value={homeMandi}
                onChange={(e) => setHomeMandi(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-900 font-semibold focus:border-emerald-600 focus:bg-white focus:outline-none"
              >
                <option value="Nashik APMC">
                  {language === 'mr-IN' ? 'नाशिक बाजार समिती (मूळ आधार)' : 'Nashik APMC (Home Baseline)'}
                </option>
                <option value="Pimpalgaon Baswant APMC">
                  {language === 'mr-IN' ? 'पिंपळगाव बसवंत बाजार समिती' : 'Pimpalgaon Baswant APMC'}
                </option>
                <option value="Sangamner APMC">
                  {language === 'mr-IN' ? 'संगमनेर बाजार समिती' : 'Sangamner APMC'}
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-800 font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>{language === 'mr-IN' ? 'विक्रीचा कालावधी' : 'Wait Horizon'}</span>
              </label>
              <select
                value={waitDays}
                onChange={(e) => setWaitDays(parseInt(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-900 font-semibold focus:border-emerald-600 focus:bg-white focus:outline-none"
              >
                <option value={1}>{language === 'mr-IN' ? '१ दिवस (+१ दिवस)' : '1 Day (+1d)'}</option>
                <option value={2}>{language === 'mr-IN' ? '२ दिवस (+२ दिवस शिफारस)' : '2 Days (+2d Recommended)'}</option>
                <option value={3}>{language === 'mr-IN' ? '३ दिवस (+३ दिवस)' : '3 Days (+3d)'}</option>
                <option value={4}>{language === 'mr-IN' ? '४ दिवस (+४ दिवस)' : '4 Days (+4d)'}</option>
              </select>
            </div>
          </div>

          {/* Risk Profile */}
          <div className="space-y-1.5">
            <label className="text-slate-800 font-bold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === 'mr-IN' ? 'जोखीम घेण्याची तयारी' : 'Farmer Risk Appetite'}</span>
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
                  {prof === 'CAUTIOUS'
                    ? (language === 'mr-IN' ? 'सुरक्षित (q20)' : 'Cautious (q20)')
                    : prof === 'BALANCED'
                    ? (language === 'mr-IN' ? 'संतुलित (q35)' : 'Balanced (q35)')
                    : (language === 'mr-IN' ? 'आक्रमक (q50)' : 'Aggressive (q50)')}
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
              {language === 'mr-IN' ? 'रद्द करा' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black transition text-xs shadow-md shadow-emerald-700/25"
            >
              {language === 'mr-IN' ? 'तपशील जतन करा व नवा निर्णय पहा' : 'Update & Recalculate Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
