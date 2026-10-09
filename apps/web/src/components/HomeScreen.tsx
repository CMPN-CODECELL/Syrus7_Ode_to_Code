import React, { useState } from 'react';
import {
  Sprout,
  Truck,
  MapPin,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Scale,
  Calendar,
  DollarSign
} from 'lucide-react';
import { DecisionRecord, SlotSchema } from '../types';

interface HomeScreenProps {
  record: DecisionRecord | null;
  slots: SlotSchema;
  onNavigateTab: (tabId: string) => void;
  onOpenVoice: () => void;
  onOpenEditLot: () => void;
  onSelectCropPreset: (crop: string, mandi: string, qty: number) => void;
  labels: Record<string, string>;
  language: 'mr-IN' | 'hi-IN' | 'en-IN';
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  record,
  slots,
  onNavigateTab,
  onSelectCropPreset,
  labels,
  language
}) => {
  // 1. Farmer Location State
  const [selectedLocation, setSelectedLocation] = useState<string>('Nashik');
  
  // Locations with nearby mandis
  const locationOptions = [
    { id: 'Nashik', name: language === 'mr-IN' ? 'नाशिक' : language === 'hi-IN' ? 'नासिक' : 'Nashik', mandis: ['Nashik APMC', 'Pimpalgaon Baswant APMC', 'Lasalgaon APMC'] },
    { id: 'Niphad', name: language === 'mr-IN' ? 'निफाड' : language === 'hi-IN' ? 'निफाड़' : 'Niphad', mandis: ['Pimpalgaon Baswant APMC', 'Lasalgaon APMC', 'Nashik APMC'] },
    { id: 'Lasalgaon', name: language === 'mr-IN' ? 'लासलगाव' : language === 'hi-IN' ? 'लासलगांव' : 'Lasalgaon', mandis: ['Lasalgaon APMC', 'Pimpalgaon Baswant APMC', 'Nashik APMC'] },
    { id: 'Pune', name: language === 'mr-IN' ? 'पुणे' : language === 'hi-IN' ? 'पुणे' : 'Pune', mandis: ['Nashik APMC', 'Pimpalgaon Baswant APMC', 'Lasalgaon APMC'] }
  ];

  // 2. Crop Selection State
  const [selectedCrop, setSelectedCrop] = useState<string>(slots.commodity || 'Tomato');

  const crops = [
    {
      id: 'Tomato',
      name: language === 'mr-IN' ? 'टोमॅटो' : language === 'hi-IN' ? 'टमाटर' : 'Tomato',
      icon: '🍅',
      defaultPrice: 1800,
      futurePrice: 1950,
      unit: language === 'mr-IN' ? 'क्विंटल' : language === 'hi-IN' ? 'क्विंटल' : 'qtl'
    },
    {
      id: 'Onion',
      name: language === 'mr-IN' ? 'कांदा' : language === 'hi-IN' ? 'प्याज' : 'Onion',
      icon: '🧅',
      defaultPrice: 2100,
      futurePrice: 2280,
      unit: language === 'mr-IN' ? 'क्विंटल' : language === 'hi-IN' ? 'क्विंटल' : 'qtl'
    },
    {
      id: 'Wheat',
      name: language === 'mr-IN' ? 'गहू' : language === 'hi-IN' ? 'गेहूं' : 'Wheat',
      icon: '🌾',
      defaultPrice: 2450,
      futurePrice: 2500,
      unit: language === 'mr-IN' ? 'क्विंटल' : language === 'hi-IN' ? 'क्विंटल' : 'qtl'
    },
    {
      id: 'Soybean',
      name: language === 'mr-IN' ? 'सोयाबीन' : language === 'hi-IN' ? 'सोयाबीन' : 'Soybean',
      icon: '🌱',
      defaultPrice: 4200,
      futurePrice: 4350,
      unit: language === 'mr-IN' ? 'क्विंटल' : language === 'hi-IN' ? 'क्विंटल' : 'qtl'
    }
  ];

  // 3. Quantity State
  const [quantity, setQuantity] = useState<number>(slots.quantity || 20);
  const [unit, setUnit] = useState<'qtl' | 'bag'>('qtl');

  // 4. Transport Preference State
  const [selectedVehicle, setSelectedVehicle] = useState<string>('pickup');

  const vehicles = [
    {
      id: 'pickup',
      title: language === 'mr-IN' ? 'पिकअप / बोलेरो' : language === 'hi-IN' ? 'पिकअप / बोलेरो' : 'Pickup Bolero',
      desc: language === 'mr-IN' ? '२० ते २५ क्विंटल (शिफारस)' : language === 'hi-IN' ? '20 से 25 क्विंटल (अनुशंसित)' : '20–25 quintal (Recommended)',
      icon: '🚚',
      rateHint: language === 'mr-IN' ? 'भाडे: ₹६००' : language === 'hi-IN' ? 'भाड़ा: ₹600' : 'Freight: ₹600'
    },
    {
      id: 'mini',
      title: language === 'mr-IN' ? 'छोटा टेम्पो' : language === 'hi-IN' ? 'छोटा टेम्पो' : 'Mini Tempo',
      desc: language === 'mr-IN' ? '१० क्विंटलपर्यंत' : language === 'hi-IN' ? '10 क्विंटल तक' : 'Up to 10 quintal',
      icon: '🛺',
      rateHint: language === 'mr-IN' ? 'भाडे: ₹४००' : language === 'hi-IN' ? 'भाड़ा: ₹400' : 'Freight: ₹400'
    },
    {
      id: 'truck',
      title: language === 'mr-IN' ? 'आयशर / मोठा ट्रक' : language === 'hi-IN' ? 'बड़ा ट्रक / आयशर' : 'Eicher / Truck',
      desc: language === 'mr-IN' ? '५०+ क्विंटल' : language === 'hi-IN' ? '50+ क्विंटल' : '50+ quintal',
      icon: '🚛',
      rateHint: language === 'mr-IN' ? 'भाडे: ₹१,२००' : language === 'hi-IN' ? 'भाड़ा: ₹1,200' : 'Freight: ₹1,200'
    },
    {
      id: 'tractor',
      title: language === 'mr-IN' ? 'स्वतःचे वाहन / ट्रॅक्टर' : language === 'hi-IN' ? 'खुद का ट्रैक्टर' : 'Own Tractor / Shared',
      desc: language === 'mr-IN' ? 'केवळ डिझेल खर्च' : language === 'hi-IN' ? 'केवल डीजल खर्च' : 'Fuel cost only',
      icon: '🚜',
      rateHint: language === 'mr-IN' ? 'भाडे: ₹३५०' : language === 'hi-IN' ? 'भाड़ा: ₹350' : 'Fuel: ₹350'
    }
  ];

  // 5. Mandi Preference State
  const [selectedMandi, setSelectedMandi] = useState<string>(slots.home_mandi || 'auto');

  const mandis = [
    {
      id: 'auto',
      name: language === 'mr-IN' ? '🌟 सर्वोत्तम भाव देणारा बाजार शोधा' : language === 'hi-IN' ? '🌟 सर्वोत्तम भाव वाली मंडी खोजें' : '🌟 Auto Find Best Mandi',
      dist: language === 'mr-IN' ? 'सर्व बाजारांची तुलना' : language === 'hi-IN' ? 'सभी मंडियों की तुलना' : 'Compares all regional mandis',
      recommended: true
    },
    {
      id: 'Nashik APMC',
      name: language === 'mr-IN' ? 'नाशिक बाजार समिती' : language === 'hi-IN' ? 'नासिक मंडी' : 'Nashik APMC',
      dist: language === 'mr-IN' ? '१२ किमी (जवळ)' : language === 'hi-IN' ? '12 किमी (पास)' : '12 km (Near)',
      recommended: false
    },
    {
      id: 'Pimpalgaon Baswant APMC',
      name: language === 'mr-IN' ? 'पिंपळगाव बसवंत बाजार' : language === 'hi-IN' ? 'पिंपलगांव मंडी' : 'Pimpalgaon Baswant APMC',
      dist: language === 'mr-IN' ? '२८ किमी' : language === 'hi-IN' ? '28 किमी' : '28 km',
      recommended: false
    },
    {
      id: 'Lasalgaon APMC',
      name: language === 'mr-IN' ? 'लासलगाव बाजार समिती' : language === 'hi-IN' ? 'लासलगांव मंडी' : 'Lasalgaon APMC',
      dist: language === 'mr-IN' ? '५२ किमी (दूर)' : language === 'hi-IN' ? '52 किमी (दूर)' : '52 km (Far)',
      recommended: false
    }
  ];

  // Price calculations based on crop and quantity
  const activeCropObj = crops.find((c) => c.id === selectedCrop) || crops[0];
  const todayTotal = (activeCropObj.defaultPrice * quantity).toLocaleString('en-IN');
  const futureTotal = (activeCropObj.futurePrice * quantity).toLocaleString('en-IN');

  const handleApplyAndGo = () => {
    const finalMandi = selectedMandi === 'auto' ? 'Nashik APMC' : selectedMandi;
    onSelectCropPreset(selectedCrop, finalMandi, quantity);
    onNavigateTab('decision');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* 1. Welcoming Farmer Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-emerald-700/20 flex-shrink-0">
            🧑‍🌾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 font-serif">
                {language === 'mr-IN' ? 'नमस्कार, शेतकरी बंधू!' : language === 'hi-IN' ? 'नमस्ते, किसान भाई!' : 'Welcome, Farmer Friend!'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                {labels.verifiedFarmer || 'Verified'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {language === 'mr-IN'
                ? 'तुमचे पीक, प्रमाण आणि गाडी निवडा — अचूक भाव व निर्णय क्षणात मिळवा.'
                : language === 'hi-IN'
                ? 'अपनी फसल, मात्रा और वाहन चुनें — सही भाव और बिक्री निर्णय तुरंत पाएं।'
                : 'Select your crop, quantity, and vehicle to get the optimal selling decision.'}
            </p>
          </div>
        </div>

        {/* Location Selector Pill */}
        <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200">
          <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <div className="text-xs">
            <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">
              {language === 'mr-IN' ? 'तुमचा तालुका / जिल्हा' : language === 'hi-IN' ? 'आपका क्षेत्र / जिला' : 'Your Location'}
            </span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent font-black text-emerald-950 text-xs focus:outline-none cursor-pointer"
            >
              {locationOptions.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Step 1: Select Your Crop (मोठे चित्र आणि पीक निवडा) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
              १
            </span>
            <h2 className="text-base font-black text-slate-900">
              {language === 'mr-IN' ? 'तुम्हाला कोणते पीक विकायचे आहे?' : language === 'hi-IN' ? 'आपको कौन सी फसल बेचनी है?' : 'Which crop do you want to sell?'}
            </h2>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
            {language === 'mr-IN' ? 'टॅप करा' : language === 'hi-IN' ? 'टैप करें' : 'Tap to select'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {crops.map((c) => {
            const isSelected = selectedCrop === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCrop(c.id)}
                className={`p-4 rounded-2xl border text-center transition transform active:scale-95 flex flex-col items-center justify-between space-y-2 ${
                  isSelected
                    ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-600/30 shadow-md'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-4xl">{c.icon}</span>
                <div>
                  <h3 className={`text-base font-black ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                    {c.name}
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500 block mt-0.5">
                    ₹{c.defaultPrice} / {c.unit}
                  </span>
                </div>
                {isSelected && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    {language === 'mr-IN' ? 'निवडले' : language === 'hi-IN' ? 'चयनित' : 'Selected'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Step 2: Enter Quantity (प्रमाण निवडा) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
              २
            </span>
            <h2 className="text-base font-black text-slate-900">
              {language === 'mr-IN' ? 'तुमच्याकडे किती माल आहे?' : language === 'hi-IN' ? 'आपके पास कितनी उपज है?' : 'How much quantity do you have?'}
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {language === 'mr-IN' ? 'एकूण प्रमाण' : language === 'hi-IN' ? 'कुल मात्रा' : 'Total Quantity'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Main Number Input */}
          <div className="flex items-center gap-2 w-full sm:w-1/2 bg-slate-50 border-2 border-emerald-200 rounded-2xl p-2 focus-within:border-emerald-600 focus-within:bg-white transition">
            <Scale className="w-6 h-6 text-emerald-600 ml-2 flex-shrink-0" />
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-full text-2xl font-black text-slate-900 bg-transparent focus:outline-none px-2"
            />
            <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setUnit('qtl')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                  unit === 'qtl' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                {language === 'mr-IN' ? 'क्विंटल' : language === 'hi-IN' ? 'क्विंटल' : 'qtl'}
              </button>
              <button
                type="button"
                onClick={() => setUnit('bag')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                  unit === 'bag' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                {language === 'mr-IN' ? 'पोती' : language === 'hi-IN' ? 'बोरी' : 'Bags'}
              </button>
            </div>
          </div>

          {/* Quick Increment Buttons (+5, +10, +20, +50) */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-1/2">
            {[5, 10, 20, 50].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setQuantity((prev) => prev + num)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-100 border border-slate-200 hover:border-emerald-300 text-slate-800 text-xs font-black transition"
              >
                +{num} {unit === 'qtl' ? (language === 'mr-IN' ? 'क्विं' : language === 'hi-IN' ? 'क्विं' : 'qtl') : (language === 'mr-IN' ? 'पोती' : language === 'hi-IN' ? 'बोरी' : 'bags')}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setQuantity(20)}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-extrabold border border-emerald-200 transition"
            >
              {language === 'mr-IN' ? 'रीसेट (२०)' : language === 'hi-IN' ? 'रीसेट (20)' : 'Reset (20)'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Step 3: Vehicle / Transport Preference (गाडी / वाहतूक निवडा) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
              ३
            </span>
            <h2 className="text-base font-black text-slate-900">
              {language === 'mr-IN' ? 'बाजारात माल नेण्यासाठी कोणती गाडी वापरणार?' : language === 'hi-IN' ? 'मंडी में माल ले जाने हेतु कौन सा वाहन चुनेंगे?' : 'Which transport vehicle will you use?'}
            </h2>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {language === 'mr-IN' ? 'पर्याय न निवडल्यास पिकअप निवडले जाईल' : language === 'hi-IN' ? 'डिफ़ॉल्ट: पिकअप' : 'Default: Pickup Bolero'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {vehicles.map((v) => {
            const isSelected = selectedVehicle === v.id;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVehicle(v.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition transform active:scale-95 space-y-2 ${
                  isSelected
                    ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-600/30 shadow-md'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{v.icon}</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {v.rateHint}
                  </span>
                </div>
                <div>
                  <h3 className={`text-sm font-black ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                    {v.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {v.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Step 4: Mandi Preference (कोणत्या बाजारात विकायचे आहे?) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
              ४
            </span>
            <h2 className="text-base font-black text-slate-900">
              {language === 'mr-IN' ? 'कोणत्या बाजार समितीत माल विकण्याची इच्छा आहे?' : language === 'hi-IN' ? 'किस मंडी में माल बेचना चाहते हैं?' : 'Preferred Mandi for Sale?'}
            </h2>
          </div>
          <span className="text-xs font-bold text-emerald-700">
            {language === 'mr-IN' ? 'जवळचे बाजार' : language === 'hi-IN' ? 'निकटतम मंडियां' : 'Nearby APMCs'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mandis.map((m) => {
            const isSelected = selectedMandi === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMandi(m.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-600/30 shadow-md'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <h3 className={`text-sm font-black ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                    {m.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {m.dist}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                }`}>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Live Price Estimate Banner for Entered Quantity */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-emerald-800 to-green-700 text-white shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeCropObj.icon}</span>
            <div>
              <span className="text-[11px] text-emerald-200 font-bold uppercase tracking-wider block">
                {language === 'mr-IN' ? 'आजचा व अंदाजित भाव (तुमच्या मालासाठी)' : language === 'hi-IN' ? 'आज का व अनुमानित भाव' : 'Estimated Revenue for your produce'}
              </span>
              <h3 className="text-lg font-black font-serif">
                {quantity} {unit === 'qtl' ? (language === 'mr-IN' ? 'क्विंटल' : language === 'hi-IN' ? 'क्विंटल' : 'qtl') : (language === 'mr-IN' ? 'पोती' : language === 'hi-IN' ? 'बोरी' : 'bags')} {activeCropObj.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-[10px] text-emerald-200 uppercase font-bold block">
                {language === 'mr-IN' ? 'आज विकल्यास' : language === 'hi-IN' ? 'आज बेचने पर' : 'Today (Sell Now)'}
              </span>
              <span className="text-xl font-black">₹{todayTotal}</span>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div>
              <span className="text-[10px] text-emerald-300 uppercase font-extrabold block">
                {language === 'mr-IN' ? '२ दिवसांनंतर' : language === 'hi-IN' ? '2 दिन बाद' : 'In 2 Days'}
              </span>
              <span className="text-xl font-black text-emerald-300">₹{futureTotal}</span>
            </div>
          </div>
        </div>

        {/* Primary Call to Action Button */}
        <div className="pt-2">
          <button
            onClick={handleApplyAndGo}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-base sm:text-lg shadow-xl shadow-black/10 transition transform hover:scale-101 active:scale-98"
          >
            <span>
              {language === 'mr-IN'
                ? 'निर्णय आणि अचूक नफा पहा (काय करावे?)'
                : language === 'hi-IN'
                ? 'निर्णय और शुद्ध मुनाफा देखें (क्या करें?)'
                : 'Get Recommendation & Pocket Realization'}
            </span>
            <ArrowRight className="w-5 h-5 text-emerald-800" />
          </button>
        </div>
      </div>
    </div>
  );
};
