import React, { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Grid3X3, List, Plus } from 'lucide-react';
import { ViewMode } from '../types';

const navItems: Array<{ mode: ViewMode; label: string; icon: React.ComponentType<{ className?: string }>; targetId: string }> = [
  { mode: 'day', label: 'Hoje', icon: CalendarDays, targetId: 'view-mode-day' },
  { mode: 'week', label: 'Semana', icon: Grid3X3, targetId: 'view-mode-week' },
  { mode: 'list', label: 'Lista', icon: List, targetId: 'view-mode-list' },
];

export const MobileBottomNav: React.FC = () => {
  const [active, setActive] = useState<ViewMode>('day');

  useEffect(() => {
    const cleanups = navItems.map((item) => {
      const node = document.getElementById(item.targetId);
      if (!node) return () => undefined;
      const handler = () => setActive(item.mode);
      node.addEventListener('click', handler);
      return () => node.removeEventListener('click', handler);
    });

    const timer = window.setTimeout(() => {
      if (window.innerWidth < 640) {
        document.getElementById('btn-today')?.click();
        document.getElementById('view-mode-day')?.click();
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  const changeView = (item: (typeof navItems)[number]) => {
    setActive(item.mode);
    if (item.mode === 'day') document.getElementById('btn-today')?.click();
    document.getElementById(item.targetId)?.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const createEvent = () => {
    document.getElementById('btn-mobile-add-event')?.click();
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    document.getElementById(direction === 'prev' ? 'btn-prev-week' : 'btn-next-week')?.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav
      className="sm:hidden fixed inset-x-4 bottom-3 z-50 rounded-[1.15rem] border border-slate-200/80 dark:border-[#292934] bg-white/96 dark:bg-[#111118]/96 backdrop-blur-xl shadow-[0_10px_32px_rgba(15,23,42,0.18)] px-1.5 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))]"
      aria-label="Navegação móvel da agenda"
    >
      {active !== 'day' && (
        <div className="grid grid-cols-[44px_1fr_44px] items-center mb-1 border-b border-slate-100 dark:border-[#24242e] pb-1">
          <button
            type="button"
            onClick={() => changeWeek('prev')}
            className="h-8 flex items-center justify-center text-slate-400 active:text-indigo-600"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-center text-[10px] font-medium text-slate-400">
            {active === 'week' ? 'Navegar semanas' : 'Mudar período'}
          </span>
          <button
            type="button"
            onClick={() => changeWeek('next')}
            className="h-8 flex items-center justify-center text-slate-400 active:text-indigo-600"
            aria-label="Próxima semana"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const selected = active === item.mode;
          return (
            <button
              key={item.mode}
              type="button"
              onClick={() => changeView(item)}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[9px] font-medium transition-all ${selected
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/8'
                : 'text-slate-400 dark:text-slate-500 active:bg-slate-100 dark:active:bg-[#1b1b24]'
              }`}
              aria-current={selected ? 'page' : undefined}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={createEvent}
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 active:bg-emerald-500/10 transition-all"
        >
          <Plus className="w-[18px] h-[18px]" />
          <span>Novo</span>
        </button>
      </div>
    </nav>
  );
};
