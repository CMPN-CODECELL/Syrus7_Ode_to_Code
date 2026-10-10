import React, { useState } from 'react';
import {
  Sliders,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Truck,
  Calendar,
  DollarSign,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { DecisionRecord, ScenarioResponse } from '../types';
import { ApiClient } from '../api/client';

interface Props {
  record: DecisionRecord | null;
  labels?: Record<string, string>;
  language?: 'mr-IN' | 'hi-IN' | 'en-IN';
}

export const ScenarioScreen: React.FC<Props> = ({ record, labels = {}, language = 'en-IN' }) => {
  // Vehicle Selection State
  const [selectedVehicle, setSelectedVehicle] = useState<'pickup' | 'tractor' | 'truck' | 'self'>('pickup');
  
  // Risk Temperament State
  const [riskTemperament, setRiskTemperament] = useState<'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE'>(
    (record?.risk_profile as any) || 'BALANCED'
  );

  // Holding Days State
  const [waitDays, setWaitDays] = useState<number>(record?.chosen.wait_days || 2);

  // Shocks State
  const [priceDeltaPct, setPriceDeltaPct] = useState<number>(0);
  const [transportDeltaPct, setTransportDeltaPct] = useState<number>(0);
  const [arrivalMultiplier, setArrivalMultiplier] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [scenarioResult, setScenarioResult] = useState<ScenarioResponse | null>(null);

  // Vehicle rate adjustments
  const vehicleConfig = {
    pickup: {
      label: language === 'mr-IN' ? 'पिकअप / बोलेरो' : language === 'hi-IN' ? 'पिकअप / बोलेरो' : 'Pickup / Bolero',
      icon: '🛺',
      costMultiplier: 1.0,
      capacity: language === 'en-IN' ? '20 qtl' : '२० क्विंटल',
      desc: language === 'mr-IN' ? 'प्रमाणित ग्रामीण पिकअप (₹२२/किमी)' : language === 'hi-IN' ? 'ग्रामीण पिकअप (₹22/किमी)' : 'Standard rural pickup (₹22/km)'
    },
    tractor: {
      label: language === 'mr-IN' ? 'ट्रॅक्टर ट्रॉली' : language === 'hi-IN' ? 'ट्रैक्टर ट्रॉली' : 'Tractor Trolley',
      icon: '🚜',
      costMultiplier: 0.75,
      capacity: language === 'en-IN' ? '50 qtl' : '५० क्विंटल',
      desc: language === 'mr-IN' ? 'सामूहिक वाहतूक बचत (₹१६/किमी)' : language === 'hi-IN' ? 'सामूहिक ढुलाई बचत (₹16/किमी)' : 'Economical group haul (₹16/km)'
    },
    truck: {
      label: language === 'mr-IN' ? '१०-चाकी ट्रक' : language === 'hi-IN' ? '10-चक्का ट्रक' : '10-Wheeler Truck',
      icon: '🚚',
      costMultiplier: 0.60,
      capacity: language === 'en-IN' ? '100+ qtl' : '१००+ क्विंटल',
      desc: language === 'mr-IN' ? 'मोठ्या अंतराची वाहतूक (₹१२/किमी)' : language === 'hi-IN' ? 'लंबी दूरी की ढुलाई (₹12/किमी)' : 'Bulk distance haul (₹12/km)'
    },
    self: {
      label: language === 'mr-IN' ? 'स्थानिक / थेट विक्री' : language === 'hi-IN' ? 'स्थानीय / सीधी बिक्री' : 'Self / Local Sale',
      icon: '🛵',
      costMultiplier: 0.0,
      capacity: language === 'en-IN' ? 'Flexible' : 'लवचिक',
      desc: language === 'mr-IN' ? 'शेत बांधावर थेट विक्री (₹० भाडे)' : language === 'hi-IN' ? 'खेत पर सीधी बिक्री (₹0 भाड़ा)' : 'Direct farm gate (₹0 freight)'
    }
  };

  // Holiday check on selected wait day
  const isHolidayDay = waitDays === 4; // Day 4 is Festival Holiday (Oct 13 Amavasya)
  const isSundayDay = waitDays === 2; // Day 2 is Sunday

  const handleRunScenario = async (
    pDelta = priceDeltaPct,
    tDelta = transportDeltaPct,
    aMult = arrivalMultiplier,
    vType = selectedVehicle,
    rProfile = riskTemperament
  ) => {
    if (!record) return;
    setLoading(true);
    try {
      // Vehicle multiplier adjusts transport delta
      const effectiveTransportDelta = tDelta + (vehicleConfig[vType].costMultiplier - 1.0);
      
      const res = await ApiClient.runScenario({
        base_request_id: record.request_id,
        commodity: record.commodity,
        quantity_qtl: record.lot_quantity_qtl,
        home_mandi: record.chosen.market,
        price_delta_pct: pDelta,
        transport_delta_pct: effectiveTransportDelta,
        arrival_multiplier: aMult,
        risk_profile: rProfile
      });
      setScenarioResult(res);
    } catch (e) {
      console.error('Scenario simulation failed:', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (record) {
      handleRunScenario();
    }
  }, [record, selectedVehicle, riskTemperament, waitDays]);

  if (!record) return null;

  // Stressed numbers or baseline
  const baselineNet = record.baseline.net_total;
  const currentSimulatedNet = scenarioResult ? scenarioResult.stressed_decision.chosen.net_total : record.chosen.net_total;
  const netDiff = currentSimulatedNet - baselineNet;
  const actionFlipped = scenarioResult?.action_flipped || false;
  const currentAction = actionFlipped ? 'SELL_NOW' : (scenarioResult?.stressed_decision.chosen.action || record.chosen.action);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* 1. Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
                {language === 'mr-IN'
                  ? 'काय घडेल नियोजन व नफा सिम्युलेटर'
                  : language === 'hi-IN'
                  ? 'क्या होगा यदि योजना व मुनाफा सिम्युलेटर'
                  : 'What-If Planner & Profit Simulator'}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {language === 'mr-IN'
                  ? 'विविध वाहने, जोखीम क्षमता, साठवणुकीचे दिवस व हवामान झटके यांचे एका क्लिकवर प्रत्यक्ष परीक्षण करा.'
                  : language === 'hi-IN'
                  ? 'विभिन्न वाहन, जोखिम क्षमता, भंडारण दिन व मौसम के झटकों का तुरंत परीक्षण करें।'
                  : 'Simulate different vehicles, risk tolerances, holding days, and weather shocks in real time.'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setPriceDeltaPct(0);
            setTransportDeltaPct(0);
            setArrivalMultiplier(1.0);
            setSelectedVehicle('pickup');
            setRiskTemperament('BALANCED');
            setWaitDays(2);
            handleRunScenario(0, 0, 1.0, 'pickup', 'BALANCED');
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{language === 'mr-IN' ? 'पूर्ववत करा' : language === 'hi-IN' ? 'रीसेट करें' : 'Reset Defaults'}</span>
        </button>
      </div>

      {/* 2. Interactive Simulator Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Control A: Vehicle Selection */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>{language === 'mr-IN' ? '१. मालवाहतूक वाहन निवडा' : language === 'hi-IN' ? '1. माल ढुलाई वाहन चुनें' : '1. Choose Transport Vehicle'}</span>
            </h2>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {vehicleConfig[selectedVehicle].label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {(Object.keys(vehicleConfig) as Array<keyof typeof vehicleConfig>).map((vKey) => {
              const v = vehicleConfig[vKey];
              const isSelected = selectedVehicle === vKey;
              return (
                <button
                  key={vKey}
                  onClick={() => setSelectedVehicle(vKey)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{v.icon}</span>
                    <div>
                      <span className="text-xs font-black text-slate-900 block leading-tight">
                        {v.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        {v.capacity}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold block mt-1.5 truncate">
                    {v.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Control B: Risk Temperament & Holding Capacity */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{language === 'mr-IN' ? '२. जोखीम क्षमता व साठवणूक तयारी' : language === 'hi-IN' ? '2. जोखिम क्षमता व भंडारण तैयारी' : '2. Risk Temperament & Holding Capacity'}</span>
            </h2>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {riskTemperament === 'CAUTIOUS' ? (language === 'mr-IN' ? 'सावध' : language === 'hi-IN' ? 'सावधान' : 'CAUTIOUS') : riskTemperament === 'AGGRESSIVE' ? (language === 'mr-IN' ? 'उच्च नफा' : language === 'hi-IN' ? 'उच्च लाभ' : 'AGGRESSIVE') : (language === 'mr-IN' ? 'संतुलित' : language === 'hi-IN' ? 'संतुलित' : 'BALANCED')}
            </span>
          </div>

          <div className="space-y-2">
            {[
              {
                id: 'CAUTIOUS' as const,
                title: language === 'mr-IN' ? '🛡️ सावध (किमान हमी भाव)' : language === 'hi-IN' ? '🛡️ सावधान (न्यूनतम गारंटी भाव)' : '🛡️ Cautious (Floor Guarantee)',
                desc: language === 'mr-IN' ? 'कर्ज सुरक्षितता व किमान आधार भावाला प्राधान्य देतो.' : language === 'hi-IN' ? 'कर्ज सुरक्षा और न्यूनतम मूल्य को प्राथमिकता।' : 'Considers lower quartile (Q10/Q25). Prioritizes debt safety, minimum price floor.',
                quantile: 'Q10: ₹1,640/qtl'
              },
              {
                id: 'BALANCED' as const,
                title: language === 'mr-IN' ? '⚖️ संतुलित (अपेक्षित कल)' : language === 'hi-IN' ? '⚖️ संतुलित (मध्यम भाव)' : '⚖️ Balanced (Median Outlook)',
                desc: language === 'mr-IN' ? 'बाजारपेठेचा मध्यम भाव (Q50) वापरतो. ६२.४% नफा यश संभाव्यता.' : language === 'hi-IN' ? 'बाजार का औसत भाव (Q50)। 62.4% सफलता संभावना।' : 'Uses expected market median (Q50). Standard trade-off with 62.4% success probability.',
                quantile: 'Q50: ₹1,950/qtl'
              },
              {
                id: 'AGGRESSIVE' as const,
                title: language === 'mr-IN' ? '🚀 उच्च नफा (कमाल शक्यता)' : language === 'hi-IN' ? '🚀 उच्च लाभ (अधिकतम संभावना)' : '🚀 High Return (Upside Potential)',
                desc: language === 'mr-IN' ? 'सण-उत्सवाच्या उच्च भावाला (Q90) लक्ष्य करतो. हवेशीर सुरक्षित साठवण आवश्यक.' : language === 'hi-IN' ? 'त्योहारी तेजी (Q90) को लक्षित करता है। सुरक्षित भंडारण आवश्यक।' : 'Targets upper quartile (Q75/Q90) festive peak. Requires dry covered storage.',
                quantile: 'Q90: ₹2,180/qtl'
              }
            ].map((r) => {
              const isSelected = riskTemperament === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRiskTemperament(r.id)}
                  className={`w-full p-3 rounded-2xl text-left border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      {r.title}
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium block mt-0.5">
                      {r.desc}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-1 rounded-xl whitespace-nowrap">
                    {r.quantile}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Control C: Holding Days Slider with Mandi Holiday Guard */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>{language === 'mr-IN' ? '३. विक्रीचा दिवस निवडा (थांबण्याची मुदत)' : language === 'hi-IN' ? '3. बिक्री का दिन चुनें (रुकने की अवधि)' : '3. Target Selling Day (Wait Horizon)'}</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {language === 'mr-IN'
                ? 'माल खराब न होता तुम्ही जास्तीत जास्त किती दिवस थांबू शकता ते निवडा.'
                : language === 'hi-IN'
                ? 'उपज खराब हुए बिना आप अधिकतम कितने दिन रुक सकते हैं, चुनें।'
                : 'Select how many days you can safely hold your produce before selling.'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-base font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              {waitDays === 0
                ? (language === 'mr-IN' ? 'आजची विक्री' : language === 'hi-IN' ? 'आज की बिक्री' : 'Sell Today')
                : (language === 'mr-IN' ? `${waitDays} दिवस थांबा` : language === 'hi-IN' ? `${waitDays} दिन रुकें` : `Wait ${waitDays} Days`)}
            </span>
          </div>
        </div>

        {/* Days Range Input */}
        <div className="space-y-3 pt-2">
          <input
            type="range"
            min="0"
            max="6"
            step="1"
            value={waitDays}
            onChange={(e) => setWaitDays(parseInt(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />

          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-600">
            {[
              { d: 0, label: language === 'mr-IN' ? 'आज (शुक्र)' : language === 'hi-IN' ? 'आज (शुक्र)' : 'Today (Fri)' },
              { d: 1, label: language === 'mr-IN' ? '+१ (शनि)' : language === 'hi-IN' ? '+1 (शनि)' : '+1d (Sat)' },
              { d: 2, label: language === 'mr-IN' ? '+२ (रवि)' : language === 'hi-IN' ? '+2 (रवि)' : '+2d (Sun)' },
              { d: 3, label: language === 'mr-IN' ? '+३ (सोम)' : language === 'hi-IN' ? '+3 (सोम)' : '+3d (Mon)' },
              { d: 4, label: language === 'mr-IN' ? '+४ (मंगळ)' : language === 'hi-IN' ? '+4 (मंगल)' : '+4d (Tue)' },
              { d: 5, label: language === 'mr-IN' ? '+५ (बुध)' : language === 'hi-IN' ? '+5 (बुध)' : '+5d (Wed)' },
              { d: 6, label: language === 'mr-IN' ? '+६ (गुरु)' : language === 'hi-IN' ? '+6 (गुरु)' : '+6d (Thu)' }
            ].map((dayItem) => (
              <button
                key={dayItem.d}
                onClick={() => setWaitDays(dayItem.d)}
                className={`py-1.5 rounded-xl transition ${
                  waitDays === dayItem.d
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'hover:bg-slate-100'
                }`}
              >
                <span className="block text-[11px] font-black">{dayItem.d}d</span>
                <span className="block text-[9px] truncate">{dayItem.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Holiday / Mandi Closure Alert Banner */}
        {isHolidayDay && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-rose-900 block">
                {language === 'mr-IN'
                  ? '🛑 बाजार बंद: अमावस्या सण सुट्टी'
                  : language === 'hi-IN'
                  ? '🛑 मंडी बंद: अमावस्या पर्व अवकाश'
                  : '🛑 MANDI CLOSED: Regional Festival (Amavasya Bazaar Holiday)'}
              </span>
              <p className="text-xs font-medium text-rose-800 mt-0.5">
                {language === 'mr-IN'
                  ? 'नाशिक व संगमनेर बाजार समित्यांचे सर्व लिलाव गेट मंगळवारी (दिवस ४) पूर्णपणे बंद आहेत. या दिवशी माल नेल्यास गाडी अडकून नुकसान होईल. कृपया दिवस ३ किंवा दिवस ५ ला विक्री करा!'
                  : language === 'hi-IN'
                  ? 'नाशिक व संगमनेर मंडी के सभी नीलामी गेट मंगलवार (दिन 4) को पूरी तरह बंद हैं। इस दिन माल ले जाने पर माल फंसने और नुकसान का खतरा है। कृपया दिन 3 या दिन 5 को बेचें।'
                  : 'All auction gates at Nashik and Sangamner APMCs are strictly closed on Day 4 (Tuesday). Transporting produce on this day will result in stranded cargo and quality degradation. Please sell on Day 3 or Day 5!'}
              </p>
            </div>
          </div>
        )}

        {isSundayDay && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 block">
                {language === 'mr-IN'
                  ? '⚠️ रविवार सुट्टी: नाशिक व संगमनेर बंद'
                  : language === 'hi-IN'
                  ? '⚠️ रविवार अवकाश: नाशिक व संगमनेर बंद'
                  : '⚠️ SUNDAY CLOSURE ALERT: Nashik & Sangamner APMCs Closed'}
              </span>
              <p className="text-xs font-medium text-amber-800 mt-0.5">
                {language === 'mr-IN'
                  ? 'नाशिक मुख्य बाजार समितीचा रविवारचा साप्ताहिक सुट्टीचा दिवस आहे. केवळ पिंपळगाव बसवंत उपबाजार मर्यादित सुरू असतो. आम्ही शनिवारी (दिवस १) विक्रीचा किंवा पिंपळगावला जाण्याचा सल्ला देतो.'
                  : language === 'hi-IN'
                  ? 'नाशिक मुख्य मंडी का रविवार को साप्ताहिक अवकाश रहता है। केवल पिंपलगांव बसवंत उप-मंडी सीमित रूप से चालू रहती है। शनिवार को बेचने या पिंपलगांव जाने की सलाह दी जाती है।'
                  : 'Nashik main APMC yard is closed for weekly Sunday off. Only Pimpalgaon Baswant sub-market operates special private trades. We recommend selling on Saturday (Day 1) or routing specifically to Pimpalgaon.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Control D: 1-Click Market Stress Shock Presets */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>{language === 'mr-IN' ? '४. बाजारपेठेतील झटके तपासा' : language === 'hi-IN' ? '4. बाजार के अप्रत्याशित झटके परखें' : '4. Test Market Shock Scenarios'}</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">{language === 'mr-IN' ? 'चाचणीसाठी क्लिक करा' : language === 'hi-IN' ? 'परीक्षण हेतु क्लिक करें' : 'Click to simulate stress'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => {
              setTransportDeltaPct(0.20);
              handleRunScenario(priceDeltaPct, 0.20, arrivalMultiplier);
            }}
            className={`p-3.5 rounded-2xl border text-left transition ${
              transportDeltaPct === 0.20
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-xs font-black text-amber-900 block">{language === 'mr-IN' ? '🌧️ मुसळधार पाऊस झटका' : language === 'hi-IN' ? '🌧️ भारी बारिश का झटका' : '🌧️ Heavy Rain Shock'}</span>
            <span className="text-[10px] text-slate-600 font-medium block mt-1">{language === 'mr-IN' ? '+२०% गाडी भाडे व रस्ता अडथळा' : language === 'hi-IN' ? '+20% भाड़ा व सड़क देरी' : '+20% Freight & Road Delay'}</span>
          </button>

          <button
            onClick={() => {
              setPriceDeltaPct(-0.15);
              handleRunScenario(-0.15, transportDeltaPct, arrivalMultiplier);
            }}
            className={`p-3.5 rounded-2xl border text-left transition ${
              priceDeltaPct === -0.15
                ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-400'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-xs font-black text-rose-900 block">{language === 'mr-IN' ? '📉 -१५% भाव घसरण' : language === 'hi-IN' ? '📉 -15% भाव गिरावट' : '📉 -15% Price Crash'}</span>
            <span className="text-[10px] text-slate-600 font-medium block mt-1">{language === 'mr-IN' ? 'बाजार मंदीची परिस्थिती' : language === 'hi-IN' ? 'मंदी का बाजार माहौल' : 'Simulate market downturn'}</span>
          </button>

          <button
            onClick={() => {
              setArrivalMultiplier(2.0);
              handleRunScenario(priceDeltaPct, transportDeltaPct, 2.0);
            }}
            className={`p-3.5 rounded-2xl border text-left transition ${
              arrivalMultiplier === 2.0
                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-xs font-black text-blue-900 block">{language === 'mr-IN' ? '📦 २.० पट आवक पूर' : language === 'hi-IN' ? '📦 2.0 गुना भारी आवक' : '📦 2.0x Supply Glut'}</span>
            <span className="text-[10px] text-slate-600 font-medium block mt-1">{language === 'mr-IN' ? 'परराज्यातून अचानक प्रचंड आवक' : language === 'hi-IN' ? 'अन्य राज्यों से अचानक भारी आवक' : 'Inter-state arrival surge'}</span>
          </button>

          <button
            onClick={() => {
              setPriceDeltaPct(0.10);
              handleRunScenario(0.10, transportDeltaPct, 1.0);
            }}
            className={`p-3.5 rounded-2xl border text-left transition ${
              priceDeltaPct === 0.10
                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-xs font-black text-emerald-900 block">{language === 'mr-IN' ? '☀️ +१०% सणासुदीची तेजी' : language === 'hi-IN' ? '☀️ +10% त्योहारी तेजी' : '☀️ +10% Festival Surge'}</span>
            <span className="text-[10px] text-slate-600 font-medium block mt-1">{language === 'mr-IN' ? 'किरकोळ खरेदीदारांची मोठी मागणी' : language === 'hi-IN' ? 'बाजार में जोरदार मांग' : 'Strong retail buying rush'}</span>
          </button>
        </div>
      </div>

      {/* 3. SIMULATION REAL-TIME OUTCOME HERO CARD */}
      <div className={`rounded-3xl p-6 sm:p-8 text-white shadow-xl transition-all ${
        currentAction === 'WAIT'
          ? 'bg-gradient-to-br from-emerald-800 to-green-700'
          : 'bg-gradient-to-br from-amber-700 to-yellow-600'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
            {currentAction === 'WAIT'
              ? (language === 'mr-IN' ? 'अपेक्षित निकाल: थांबा' : language === 'hi-IN' ? 'परीक्षण परिणाम: रुकें' : 'SIMULATED VERDICT: WAIT')
              : (language === 'mr-IN' ? 'अपेक्षित निकाल: आजच विका' : language === 'hi-IN' ? 'परीक्षण परिणाम: आज ही बेचें' : 'SIMULATED VERDICT: SELL NOW')}
          </span>

          {actionFlipped && (
            <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-black animate-bounce shadow-md">
              {language === 'mr-IN'
                ? '⚠️ बाजारातील झटक्यामुळे निर्णय बदलला: आजच विका!'
                : language === 'hi-IN'
                ? '⚠️ झटके के कारण निर्णय बदला: आज ही बेचें!'
                : '⚠️ Market Shock Flipped Recommendation to SELL NOW!'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {/* Box 1: Baseline Today */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block">
              {language === 'mr-IN' ? 'आजची आधारभूत रक्कम' : language === 'hi-IN' ? 'आज की आधारभूत रकम' : "Today's Net Baseline"}
            </span>
            <div className="text-2xl font-black text-white mt-1">
              ₹{baselineNet.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-100 font-medium block mt-0.5">
              {language === 'mr-IN'
                ? `आज ${record.baseline.market.replace(' APMC', ' बाजार समितीत')} विक्री`
                : language === 'hi-IN'
                ? `आज ${record.baseline.market.replace(' APMC', ' मंडी में')} बिक्री`
                : `Selling today at ${record.baseline.market}`}
            </span>
          </div>

          {/* Box 2: Simulated Realization */}
          <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/25 ring-2 ring-white/30">
            <span className="text-xs font-bold text-amber-200 uppercase tracking-wider block">
              {language === 'mr-IN' ? 'अपेक्षित प्रत्यक्ष मिळकत' : language === 'hi-IN' ? 'हाथ में आने वाली राशि' : 'Simulated In-Hand Cash'}
            </span>
            <div className="text-3xl font-black text-white mt-1">
              ₹{Math.round(currentSimulatedNet).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-amber-100 font-medium block mt-0.5">
              {language === 'mr-IN' ? 'वाहन व झटके वजा जाता हातात पडणारी रक्कम' : language === 'hi-IN' ? 'वाहन व झटके घटाकर शुद्ध रकम' : 'Net cash after vehicle & shock deductions'}
            </span>
          </div>

          {/* Box 3: Gain / Loss vs Today */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block">
              {language === 'mr-IN' ? 'नफ्यातील फरक' : language === 'hi-IN' ? 'मुनाफे में अंतर' : 'Net Profit Difference'}
            </span>
            <div className={`text-2xl font-black mt-1 ${netDiff >= 0 ? 'text-green-300' : 'text-rose-300'}`}>
              {netDiff >= 0 ? `+₹${Math.round(netDiff).toLocaleString('en-IN')}` : `-₹${Math.round(Math.abs(netDiff)).toLocaleString('en-IN')}`}
            </div>
            <span className="text-[11px] text-emerald-100 font-medium block mt-0.5">
              {netDiff >= 0
                ? (language === 'mr-IN' ? 'आज विकण्यापेक्षा जास्त फायदेशीर' : language === 'hi-IN' ? 'आज बेचने से अधिक लाभदायक' : 'Favorable return over selling today')
                : (language === 'mr-IN' ? 'नुकसानीचा धोका आढळला!' : language === 'hi-IN' ? 'नुकसान का जोखिम!' : 'Downside risk detected!')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
