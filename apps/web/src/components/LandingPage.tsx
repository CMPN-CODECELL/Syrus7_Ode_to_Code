import React, { useState, useEffect } from 'react';
import { Sprout, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
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

      {/* Top Brand Pill & Skip Option while video is playing */}
      {!animationFinished && (
        <div className="absolute top-6 right-6 z-30">
          <button
            onClick={() => setAnimationFinished(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 text-white/90 text-xs font-semibold backdrop-blur-md border border-white/20 transition transform active:scale-95"
          >
            <span>Skip Intro (पुढे जा)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Progress bar during initial single video playback */}
      {!animationFinished && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 sm:w-64 z-20 text-center space-y-2">
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-emerald-400 transition-all duration-75 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-white/70 font-medium tracking-wide">
            कृषिनिर्णय सुरू होत आहे...
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
                केवळ बाजार भाव नव्हे, तर वाहतूक खर्च व नासाडी वजा करून शेतकऱ्याचा <strong>खरा निव्वळ नफा</strong> ठरवणारे तंत्रज्ञान.
              </p>
            </div>

            {/* Quick reassurance tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-emerald-100 font-medium">
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                टोमॅटो आणि कांदा
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ३ बाजार समित्या
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                मराठी / हिंदी आवाज
              </span>
            </div>

            {/* Primary 'Get Started' Button */}
            <div className="pt-2">
              <button
                onClick={onGetStarted}
                className="w-full group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg sm:text-xl shadow-xl shadow-emerald-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
                aria-label="Get Started with KrishiNirnay"
              >
                <span>सुरू करा • Get Started</span>
                <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
