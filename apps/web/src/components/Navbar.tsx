import React from 'react';
import { Sprout, Edit3, Globe, Sun, Moon, Sliders, Layers } from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: 'mr-IN' | 'hi-IN' | 'en-IN';
  setLanguage: (lang: 'mr-IN' | 'hi-IN' | 'en-IN') => void;
  riskProfile: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE';
  setRiskProfile: (prof: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenVoice: () => void;
  onOpenEditLot: () => void;
  onOpenLanding?: () => void;
  onOpenJudgeTools?: () => void;
  lotSummary: string;
  labels: Record<string, string>;
  wsStatus?: 'connected' | 'disconnected' | 'connecting';
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  riskProfile,
  setRiskProfile,
  theme,
  onToggleTheme,
  onOpenVoice,
  onOpenEditLot,
  onOpenLanding,
  onOpenJudgeTools,
  lotSummary,
  labels,
  wsStatus = 'connected'
}) => {
  // Clear, intuitive tabs localized cleanly without hybrid strings
  const farmerTabs = [
    {
      id: 'advice',
      label: language === 'mr-IN' ? '📈 बाजार सल्ला' : language === 'hi-IN' ? '📈 मंडी सलाह' : '📈 Market Advice'
    },
    {
      id: 'simulator',
      label: language === 'mr-IN' ? '🧪 काय घडेल नियोजन' : language === 'hi-IN' ? '🧪 क्या होगा अगर' : '🧪 What-If Planner'
    },
    {
      id: 'costs',
      label: language === 'mr-IN' ? '💰 खर्च पावती' : language === 'hi-IN' ? '💰 खर्च रसीद' : '💰 Expense Bill'
    },
    {
      id: 'farm',
      label: language === 'mr-IN' ? '🌾 माझे शेत' : language === 'hi-IN' ? '🌾 मेरा खेत' : '🌾 My Farm'
    }
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <button
            onClick={onOpenLanding}
            className="flex items-center gap-3 text-left hover:opacity-90 transition group"
            title="Go to Welcome / Landing Page"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 to-green-600 flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-emerald-950 font-serif block leading-tight">
                KrishiNirnay
              </span>
              <p className="text-[11px] text-emerald-800 font-medium hidden sm:block">
                {language === 'mr-IN'
                  ? 'योग्य भावात, समृद्धीच्या वाटेवर.'
                  : language === 'hi-IN'
                  ? 'सही भाव से, समृद्धि की राह पे.'
                  : 'Sahi Bhav Se, Samriddhi Ki Raah Pe.'}
              </p>
            </div>
          </button>

          {/* Current Lot Pill */}
          <div className="hidden md:flex items-center gap-2 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 text-xs text-emerald-900 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>{lotSummary}</span>
            <button
              onClick={onOpenEditLot}
              className="ml-1 text-emerald-700 hover:text-emerald-900 p-1 hover:bg-emerald-100 rounded-full transition"
              title="Change produce or mandi"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Controls: Live Feed + Language Selector + Judge Tools Button */}
          <div className="flex items-center gap-2">
            {/* Live WebSocket Status Pill */}
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-[11px] font-bold text-emerald-900 shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : wsStatus === 'connecting' ? 'bg-amber-500 animate-ping' : 'bg-red-400'}`}></span>
              <span className="hidden sm:inline font-mono">
                {wsStatus === 'connected'
                  ? language === 'mr-IN'
                    ? 'थेट बाजार प्रवाह'
                    : language === 'hi-IN'
                    ? 'लाइव स्ट्रीम'
                    : 'Live Stream'
                  : 'Connecting...'}
              </span>
            </div>

            {/* Prominent, Persistent Language Selector [ 🇮🇳 मराठी | 🌐 English ] */}
            <div className="flex items-center bg-emerald-50/90 rounded-2xl p-1 border-2 border-emerald-300 shadow-xs text-xs">
              <button
                onClick={() => setLanguage('mr-IN')}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                  language === 'mr-IN'
                    ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-600'
                    : 'text-emerald-900 hover:bg-emerald-100'
                }`}
              >
                <span>🇮🇳</span>
                <span>मराठी</span>
              </button>
              <button
                onClick={() => setLanguage('hi-IN')}
                className={`px-2 py-1 rounded-xl text-xs font-bold transition-all ${
                  language === 'hi-IN'
                    ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-600'
                    : 'text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('en-IN')}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                  language === 'en-IN'
                    ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-600'
                    : 'text-emerald-900 hover:bg-emerald-100'
                }`}
              >
                <span>🌐</span>
                <span>English</span>
              </button>
            </div>

            {/* Judge & Technical Tools Pill */}
            {onOpenJudgeTools && (
              <button
                onClick={onOpenJudgeTools}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-extrabold text-[11px] border border-slate-700 transition shadow-xs"
                title="View Technical Heatmap, Forecast Models & Stress Simulator for Judges"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">
                  {language === 'mr-IN' ? '📊 सखोल अहवाल' : language === 'hi-IN' ? '📊 तकनीकी रिपोर्ट' : '📊 Judge Tools'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Main Farmer Tabs */}
        <nav className="flex items-center space-x-2 py-2 border-t border-emerald-50">
          {farmerTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-emerald-700 text-white shadow-sm scale-101'
                  : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
