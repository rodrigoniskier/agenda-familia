import React from 'react';
import { FamilyMember, ViewMode, ThemeMode, WeekDay } from '../types';
import { getWeekLabel } from '../utils/dateUtils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Moon,
  Sun,
  Users,
  Share2,
  Cloud,
  List,
  Grid3X3,
  CalendarDays,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { DailyCheckins } from './DailyCheckins';

interface HeaderProps {
  currentWeekDays: WeekDay[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  members: FamilyMember[];
  selectedMemberId: string;
  onSelectMember: (id: string) => void;
  onOpenMembersModal: () => void;
  onOpenShareModal: () => void;
  onOpenGoogleSyncModal: () => void;
  onOpenNewEventModal: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  googleUser: User | null;
  googleAccessToken: string | null;
  pendingCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentWeekDays,
  onPrevWeek,
  onNextWeek,
  onToday,
  viewMode,
  onChangeViewMode,
  members,
  selectedMemberId,
  onSelectMember,
  onOpenMembersModal,
  onOpenShareModal,
  onOpenGoogleSyncModal,
  onOpenNewEventModal,
  theme,
  onToggleTheme,
  googleUser,
  googleAccessToken,
  pendingCount = 0,
}) => {
  const weekTitle = getWeekLabel(currentWeekDays);

  return (
    <header className="sm:sticky sm:top-0 z-30 bg-white/95 dark:bg-[#0d0d12]/95 backdrop-blur-xl border-b border-slate-200 dark:border-[#1f1f27] transition-colors">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.35)] shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  Família Sales-Barbosa
                </h1>
                <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 whitespace-nowrap">
                  {pendingCount} {pendingCount === 1 ? 'pendente' : 'pendentes'}
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Agenda familiar compartilhada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              id="btn-open-google-sync"
              onClick={onOpenGoogleSyncModal}
              className={`p-2 rounded-xl border transition-all ${
                googleUser && googleAccessToken
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-[#16161e] border-slate-200 dark:border-[#23232e] text-slate-600 dark:text-slate-300'
              }`}
              title="Google Calendar"
            >
              <Cloud className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="btn-open-share"
              onClick={onOpenShareModal}
              className="p-2 rounded-xl border border-slate-200 dark:border-[#23232e] bg-white dark:bg-[#16161e] text-emerald-600 dark:text-emerald-400"
              title="Compartilhar agenda"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="btn-toggle-theme"
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-[#23232e] bg-white dark:bg-[#16161e] text-slate-700 dark:text-slate-300"
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              id="btn-create-event-header"
              onClick={onOpenNewEventModal}
              className="hidden sm:flex lg:hidden items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Novo</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-slate-200/70 dark:border-[#1f1f27]">
          <div className="flex items-center gap-1.5 min-w-0 sm:shrink-0">
            <button
              type="button"
              id="btn-prev-week"
              onClick={onPrevWeek}
              className="p-2 rounded-xl border border-slate-200 dark:border-[#23232e] bg-white dark:bg-[#16161e] text-slate-600 dark:text-slate-300"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="btn-today"
              onClick={onToday}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#23232e] bg-white dark:bg-[#16161e] text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Hoje
            </button>
            <button
              type="button"
              id="btn-next-week"
              onClick={onNextWeek}
              className="p-2 rounded-xl border border-slate-200 dark:border-[#23232e] bg-white dark:bg-[#16161e] text-slate-600 dark:text-slate-300"
              title="Próxima semana"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="ml-1 text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate flex-1 sm:flex-none text-right sm:text-left">
              {weekTitle}
            </span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:ml-auto min-w-0">
            <button
              type="button"
              id="filter-member-all"
              onClick={() => onSelectMember('all')}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedMemberId === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-[#16161e] text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>👨‍👩‍👧‍👦</span>
              <span>Todos</span>
            </button>

            {members.map((member) => (
              <button
                key={member.id}
                type="button"
                id={`filter-member-${member.id}`}
                onClick={() => onSelectMember(member.id)}
                className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedMemberId === member.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-[#16161e] text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{member.avatar}</span>
                <span>{member.name}</span>
              </button>
            ))}

            <button
              type="button"
              id="btn-open-members-modal"
              onClick={onOpenMembersModal}
              className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-indigo-600 bg-slate-100 dark:bg-[#16161e]"
              title="Gerenciar membros"
            >
              <Users className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e] shrink-0">
            <button
              type="button"
              id="view-mode-week"
              onClick={() => onChangeViewMode('week')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'week' ? 'bg-white dark:bg-[#0d0d12] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Semana</span>
            </button>
            <button
              type="button"
              id="view-mode-day"
              onClick={() => onChangeViewMode('day')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'day' ? 'bg-white dark:bg-[#0d0d12] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Dia</span>
            </button>
            <button
              type="button"
              id="view-mode-list"
              onClick={() => onChangeViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'list' ? 'bg-white dark:bg-[#0d0d12] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
          </div>
        </div>

        <DailyCheckins members={members} />
      </div>
    </header>
  );
};
