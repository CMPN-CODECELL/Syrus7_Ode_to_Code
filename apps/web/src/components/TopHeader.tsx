import React from 'react';
import { Menu, Sprout, Edit3, Sun, Mic, ShieldCheck, PlayCircle } from 'lucide-react';
import { SlotSchema } from '../types';

interface TopHeaderProps {
  onToggleMobileSidebar: () => void;
  slots: SlotSchema;
  onOpenEditLot: () => void;
  onOpenVoice: () => void;
  onOpenLanding: () => void;
  lotSummary: string;
  labels: Record<string, string>;
  language: 'mr-IN' | 'hi-IN' | 'en-IN';
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleMobileSidebar,
  slots,
  onOpenEditLot,
  onOpenVoice,
  onOpenLanding,
  lotSummary,
  labels,
  language
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-emerald-100 dark:border-slate-800 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-2xs">
      {/* Left: Mobile Sidebar Trigger + Title / Produce Lot Badge */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition"
          aria-label="Open Sidebar Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current Active Lot Chip (Click to Edit) */}
        <button
          onClick={onOpenEditLot}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300 text-xs font-bold transition shadow-2xs"
          title="Edit crop, quantity, or home mandi"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{lotSummary}</span>
          <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-0.5" />
        </button>
      </div>

      {/* Right: Weather Pill + Intro Video Pill + Krishi Mitra Button */}
      <div className="flex items-center gap-2.5">
        {/* Weather Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-xs font-bold">
          <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
          <span>28°C • {labels.sunnyClear || 'Clear Sky'}</span>
        </div>

        {/* Intro Video Pill */}
        <button
          onClick={onOpenLanding}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition border border-slate-200 dark:border-slate-700"
          title="Watch Logo & Intro Video"
        >
          <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>{labels.introVideo || 'Intro'}</span>
        </button>

        {/* Voice Assistant Instant Trigger */}
        <button
          onClick={onOpenVoice}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md shadow-emerald-700/25 transition active:scale-95"
          title="Open Krishi Mitra Voice Assistant"
        >
          <Mic className="w-4 h-4 text-white" />
          <span>{labels.speak || 'Speak'}</span>
        </button>
      </div>
    </header>
  );
};
