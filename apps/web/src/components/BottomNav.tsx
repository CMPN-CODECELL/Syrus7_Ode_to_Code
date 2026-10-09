import React from 'react';
import { TrendingUp, Sliders, Receipt, Sprout } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  labels: Record<string, string>;
  language: 'mr-IN' | 'hi-IN' | 'en-IN';
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  language
}) => {
  const navItems = [
    {
      id: 'advice',
      label: 'Advice',
      icon: TrendingUp,
      isHighlight: true
    },
    {
      id: 'simulator',
      label: 'Planner',
      icon: Sliders
    },
    {
      id: 'costs',
      label: 'Bill',
      icon: Receipt
    },
    {
      id: 'farm',
      label: 'My Farm',
      icon: Sprout
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-emerald-100 shadow-xl px-4 py-2 md:hidden">
      <div className="max-w-md mx-auto flex items-center justify-around">
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
                <div className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 active:scale-95 ${
                  isActive
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-emerald-700/30'
                    : 'bg-emerald-700 text-white shadow-emerald-700/25'
                }`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-[11px] font-black mt-1 ${
                  isActive ? 'text-emerald-900' : 'text-slate-600'
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
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition ${
                isActive
                  ? 'text-emerald-800 font-black'
                  : 'text-slate-500 hover:text-slate-800 font-bold'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition ${isActive ? 'bg-emerald-50 text-emerald-700' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
              </div>
              <span className={`text-[11px] leading-tight mt-0.5 ${
                isActive ? 'text-emerald-950 font-black' : 'text-slate-600'
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
