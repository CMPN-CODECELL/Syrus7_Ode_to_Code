import React from 'react';
import { Sprout, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div 
      className="fixed inset-0 w-screen h-screen z-50 bg-black overflow-hidden flex items-center justify-center cursor-pointer select-none"
      onClick={onGetStarted}
    >
      {/* Fullscreen Video / Animated Media covering the entire screen */}
      <img
        src="/krishi_landing_animation.gif"
        alt="KrishiNirnay Intro"
        className="w-full h-full object-cover object-center pointer-events-none"
      />

      {/* Floating 'Get Started' Button with the Logo */}
      <div 
        className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 z-20"
        onClick={(e) => {
          e.stopPropagation();
          onGetStarted();
        }}
      >
        <button
          onClick={onGetStarted}
          className="group flex items-center gap-3.5 px-8 py-4 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white font-black text-lg sm:text-xl shadow-2xl shadow-black/90 backdrop-blur-md border border-white/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
          aria-label="Get Started"
        >
          {/* Logo */}
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md text-emerald-700 group-hover:rotate-12 transition-transform">
            <Sprout className="w-6 h-6 text-emerald-700" />
          </div>

          <span className="tracking-wide">Get Started</span>

          <ArrowRight className="w-5 h-5 text-emerald-200 group-hover:translate-x-1.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
