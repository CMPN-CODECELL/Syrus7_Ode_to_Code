import React from 'react';
import { Sprout, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  language?: 'mr-IN' | 'hi-IN' | 'en-IN';
  setLanguage?: (lang: 'mr-IN' | 'hi-IN' | 'en-IN') => void;
  labels?: Record<string, string>;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  language = 'mr-IN',
  setLanguage,
  labels = {}
}) => {
  return (
    <div className="fixed inset-0 w-screen h-screen z-50 bg-[#0B1510] text-white flex items-center justify-center p-4 select-none">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full"></div>

      <div className="relative z-10 max-w-lg w-full bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl text-center space-y-6">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 text-white">
          <Sprout className="w-9 h-9" />
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif text-white">
            KrishiNirnay
          </h1>
          <p className="text-base sm:text-lg font-bold text-emerald-300">
            “Sahi Bhav Se, Samriddhi Ki Raah Pe.”
          </p>
          <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed max-w-sm mx-auto">
            {language === 'mr-IN'
              ? 'केवळ बाजार भाव नव्हे, तर गाडी भाडे व नासाडी वजा करून शेतकऱ्याचा खरा निव्वळ नफा ठरवणारे सोपे ॲप.'
              : language === 'hi-IN'
              ? 'केवल मंडी भाव ही नहीं, बल्कि ढुलाई खर्च और खराबी घटाकर किसान का असली शुद्ध मुनाफा बताने वाला ऐप।'
              : 'Not just market prices, but factoring freight and perishability to maximize your true pocket realization.'}
          </p>
        </div>

        {/* 1-Tap Language Choice */}
        {setLanguage && (
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
              {language === 'mr-IN' ? 'तुमची भाषा निवडा' : language === 'hi-IN' ? 'अपनी भाषा चुनें' : 'Choose Your Language'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('mr-IN')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-black transition border ${
                  language === 'mr-IN'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black scale-102'
                    : 'bg-white/10 text-white hover:bg-white/20 border-white/15'
                }`}
              >
                मराठी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi-IN')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-black transition border ${
                  language === 'hi-IN'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black scale-102'
                    : 'bg-white/10 text-white hover:bg-white/20 border-white/15'
                }`}
              >
                हिंदी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en-IN')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-black transition border ${
                  language === 'en-IN'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black scale-102'
                    : 'bg-white/10 text-white hover:bg-white/20 border-white/15'
                }`}
              >
                English
              </button>
            </div>
          </div>
        )}

        {/* 3 Reassurance Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-emerald-100 font-medium pt-1">
          <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {language === 'mr-IN' ? 'टोमॅटो आणि कांदा' : language === 'hi-IN' ? 'टमाटर और प्याज' : 'Tomato & Onion'}
          </span>
          <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {language === 'mr-IN' ? 'जवळच्या बाजार समित्या' : language === 'hi-IN' ? 'निकटतम मंडियां' : 'Local APMCs'}
          </span>
          <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {language === 'mr-IN' ? 'सोपा व स्पष्ट हिशोब' : language === 'hi-IN' ? 'सीधा हिसाब' : 'Net Realization'}
          </span>
        </div>

        {/* Primary Action Button */}
        <div className="pt-3">
          <button
            onClick={onGetStarted}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg shadow-xl shadow-emerald-500/30 transition transform hover:scale-102 active:scale-98"
          >
            <span>{language === 'mr-IN' ? 'सुरू करा (Start)' : language === 'hi-IN' ? 'शुरू करें (Start)' : 'Get Started'}</span>
            <ArrowRight className="w-5 h-5 text-slate-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
