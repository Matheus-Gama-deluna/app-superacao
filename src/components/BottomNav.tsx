import React from 'react';
import { Home, Dumbbell, Calendar, TrendingUp } from 'lucide-react';

export type TabDestination = 'home' | 'workouts' | 'calendar' | 'progress';

interface BottomNavProps {
  currentTab: TabDestination;
  onSelectTab: (tab: TabDestination) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'home' as TabDestination, label: 'Início', icon: Home },
    { id: 'workouts' as TabDestination, label: 'Treinos', icon: Dumbbell },
    { id: 'calendar' as TabDestination, label: 'Agenda', icon: Calendar },
    { id: 'progress' as TabDestination, label: 'Progresso', icon: TrendingUp },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#C9DBD3] pb-safe shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-4 h-16 items-center px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-all cursor-pointer relative focus-visible:ring-2 focus-visible:ring-[#125F55] focus-visible:outline-none rounded-2xl ${
                isActive ? 'text-[#125F55]' : 'text-[#5B7170] hover:text-[#152A29]'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`flex items-center justify-center w-10 h-7 rounded-xl transition-all ${
                  isActive ? 'bg-[#EAF3EF] text-[#125F55]' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className={`text-[11px] font-medium tracking-tight mt-0.5 ${isActive ? 'font-bold text-[#125F55]' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-1 w-1 h-1 rounded-full bg-[#125F55]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
