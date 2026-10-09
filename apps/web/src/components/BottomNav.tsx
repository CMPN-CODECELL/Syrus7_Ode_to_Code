import React from 'react';
import {
  Home,
  Sprout,
  Calendar,
  TrendingUp,
  Sliders,
  Mic,
  User
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  labels: Record<string, string>;
  language: 'mr-IN' | 'hi-IN' | 'en-IN';
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  labels,
  language
}) => {
  const navItems = [
    {
      id: 'home',
      label: labels.home || 'Home',
      icon: Home
    },
    {
      id: 'decision',
      label: labels.decision || 'Decision',
      icon: Sprout
    },
    {
      id: 'heatmap',
      label: labels.heatmap || '3×7 Heatmap',
      icon: Calendar
    },
    {
      id: 'forecast',
      label: labels.forecast || 'Forecast',
      icon: TrendingUp
    },
    {
      id: 'scenarios',
      label: labels.scenarios || 'What-If',
      icon: Sliders
    },
    {
      id: 'assistant',
      label: language === 'mr-IN' ? 'कृषी मित्र' : language === 'hi-IN' ? 'कृषि मित्र' : 'Co-Pilot',
      icon: Mic,
      isHighlight: true
    },
    {
      id: 'profile',
      label: labels.profile || 'My Farm',
      icon: User
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-emerald-100 shadow-lg px-2 py-1.5 transition-colors duration-200">
      <div className="max-w-3xl mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isHighlight) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center -mt-5 group"
                title={item.label}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 active:scale-95 ${
                  isActive
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-emerald-700/30'
                    : 'bg-emerald-700 text-white shadow-emerald-700/25'
                }`}>
                  <Icon className="w-5 h-5 text-white animate-pulse" />
                </div>
                <span className={`text-[10px] font-black mt-1 ${
                  isActive ? 'text-emerald-800' : 'text-slate-600'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition ${
                isActive
                  ? 'text-emerald-700 font-black'
                  : 'text-slate-500 hover:text-slate-800 font-bold'
              }`}
            >
              <div className={`p-1 rounded-xl transition ${isActive ? 'bg-emerald-50' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
              </div>
              <span className={`text-[10px] leading-tight mt-0.5 line-clamp-1 ${
                isActive ? 'text-emerald-900 font-extrabold' : 'text-slate-600'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
