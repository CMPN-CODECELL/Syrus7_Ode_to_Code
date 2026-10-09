import React, { useState, useEffect } from 'react';
import { Sprout, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

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
  // Animation duration is 3.84 seconds for the GIF
  const [animationFinished, setAnimationFinished] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 3840; // 3.84s total duration of animation

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        setAnimationFinished(true);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const skipText = labels.skipIntro || (language === 'mr-IN' ? 'पुढे जा (Skip)' : language === 'hi-IN' ? 'आगे बढ़ें (Skip)' : 'Skip Intro');
  const initText = labels.appInitializing || (language === 'mr-IN' ? 'कृषिनिर्णय सुरू होत आहे...' : language === 'hi-IN' ? 'कृषिनिर्णय प्रारंभ हो रहा है...' : 'Initializing KrishiNirnay...');
  const getStartedText = labels.getStarted || (language === 'mr-IN' ? 'सुरू करा • Get Started' : language === 'hi-IN' ? 'शुरू करें • Get Started' : 'Get Started');
  const subtitleText = labels.heroSubtitle || (language === 'mr-IN'
    ? 'केवळ बाजार भाव नव्हे, तर वाहतूक खर्च व नासाडी वजा करून शेतकऱ्याचा खरा निव्वळ नफा ठरवणारे तंत्रज्ञान.'
    : language === 'hi-IN'
    ? 'केवल मंडी भाव ही नहीं, बल्कि ढुलाई खर्च और उपज खराबी घटाकर किसान का असली शुद्ध मुनाफा तय करने वाली तकनीक।'
    : 'Not just market prices, but factoring transport costs and spoilage to determine a farmer’s true net realization.');

  return (
    <div 
      className="fixed inset-0 w-screen h-screen z-50 bg-slate-950 overflow-hidden flex items-center justify-center select-none"
    >
      {/* Background: Video/GIF while playing, or Static Last Frame once completed */}
      {!animationFinished ? (
        <img
          src="/krishi_landing_animation.gif"
          alt="KrishiNirnay Animation"
          className="w-full h-full object-cover object-center pointer-events-none"
        />
      ) : (
        <img
          src="/krishi_landing_last_frame.png"
          alt="KrishiNirnay Brand"
          className="w-full h-full object-cover object-center transition-opacity duration-1000 opacity-80"
        />
      )}

      {/* Subtle vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60 pointer-events-none" />

      {/* Top Bar: Language Switcher (Left) & Skip Option (Right) */}
      <div className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between">
        {setLanguage && (
          <div className="flex items-center bg-black/60 backdrop-blur-md rounded-2xl p-1 border border-white/20 text-xs">
            <button
              onClick={() => setLanguage('mr-IN')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                language === 'mr-IN' ? 'bg-emerald-600 text-white shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              मराठी
            </button>
            <button
              onClick={() => setLanguage('hi-IN')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                language === 'hi-IN' ? 'bg-emerald-600 text-white shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setLanguage('en-IN')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                language === 'en-IN' ? 'bg-emerald-600 text-white shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        )}

        {!animationFinished && (
          <button
            onClick={() => setAnimationFinished(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 text-white/90 text-xs font-semibold backdrop-blur-md border border-white/20 transition transform active:scale-95"
          >
            <span>{skipText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Progress bar during initial single video playback */}
      {!animationFinished && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 sm:w-64 z-20 text-center space-y-2">
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-emerald-400 transition-all duration-75 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-white/80 font-medium tracking-wide">
            {initText}
          </p>
        </div>
      )}

      {/* Once the video completes its single run: Reveal the Clear, Beginner-Friendly Hero Card & Get Started */}
      {animationFinished && (
        <div className="absolute z-30 max-w-lg w-11/12 mx-auto text-center animate-in fade-in zoom-in-95 duration-700">
          <div className="bg-white/10 backdrop-blur-xl border border-white/25 p-8 sm:p-10 rounded-3xl shadow-2xl text-white space-y-6">
            {/* Logo Badge */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 text-white transform hover:rotate-6 transition-transform">
              <Sprout className="w-9 h-9" />
            </div>

            {/* Title & Tagline */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-serif">
                KrishiNirnay
              </h1>
              <p className="text-base sm:text-lg font-bold text-emerald-300">
                “Sahi Bhav Se, Samriddhi Ki Raah Pe.”
              </p>
              <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed max-w-sm mx-auto">
                {subtitleText}
              </p>
            </div>

            {/* Quick reassurance tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-emerald-100 font-medium">
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {labels.tagProduce || (language === 'mr-IN' ? 'टोमॅटो आणि कांदा' : language === 'hi-IN' ? 'टमाटर और प्याज' : 'Tomato & Onion')}
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {labels.tagMandis || (language === 'mr-IN' ? '३ बाजार समित्या' : language === 'hi-IN' ? '3 प्रमुख मंडियां' : '3 Verified APMCs')}
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {labels.tagVoice || (language === 'mr-IN' ? 'मराठी / हिंदी आवाज' : language === 'hi-IN' ? 'मराठी / हिंदी आवाज' : 'Voice Guidance')}
              </span>
            </div>

            {/* Primary 'Get Started' Button */}
            <div className="pt-2">
              <button
                onClick={onGetStarted}
                className="w-full group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg sm:text-xl shadow-xl shadow-emerald-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
                aria-label="Get Started with KrishiNirnay"
              >
                <span>{getStartedText}</span>
                <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
