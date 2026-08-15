import React, { useEffect, useState } from 'react';
import { CalendarDays, Grid3X3, List, Plus } from 'lucide-react';
import { ViewMode } from '../types';

const navItems: Array<{ mode: ViewMode; label: string; icon: React.ComponentType<{ className?: string }>; targetId: string }> = [
  { mode: 'week', label: 'Semana', icon: Grid3X3, targetId: 'view-mode-week' },
  { mode: 'day', label: 'Dia', icon: CalendarDays, targetId: 'view-mode-day' },
  { mode: 'list', label: 'Lista', icon: List, targetId: 'view-mode-list' },
];

export const MobileBottomNav: React.FC = () => {
  const [active, setActive] = useState<ViewMode>('week');

  useEffect(() => {
    const cleanups = navItems.map((item) => {
      const node = document.getElementById(item.targetId);
      if (!node) return () => undefined;
      const handler = () => setActive(item.mode);
      node.addEventListener('click', handler);
      return () => node.removeEventListener('click', handler);
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  const changeView = (item: (typeof navItems)[number]) => {
    setActive(item.mode);
    document.getElementById(item.targetId)?.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const createEvent = () => {
    document.getElementById('btn-mobile-add-event')?.click();
  };

  return (
    <nav className="sm:hidden fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-slate-200/90 dark:border-[#292934] bg-white/95 dark:bg-[#111118]/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(15,23,42,0.24)] px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]" aria-label="Navegação móvel da agenda">
      <div className="grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const selected = active === item.mode;
          return (
            <button
              key={item.mode}
              type="button"
              onClick={() => changeView(item)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-all ${selected
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-[#1b1b24]'
              }`}
              aria-current={selected ? 'page' : undefined}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={createEvent}
          className="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-bold bg-emerald-500 text-white shadow-sm active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Novo</span>
        </button>
      </div>
    </nav>
  );
};
