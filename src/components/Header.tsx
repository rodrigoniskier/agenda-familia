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
  Sparkles
} from 'lucide-react';
import { User } from 'firebase/auth';

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
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0d0d12]/90 backdrop-blur-md border-b border-slate-200 dark:border-[#1f1f27] transition-colors">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 space-y-2.5">
        {/* Top Row: App Title + Primary Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.4)]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Família Sales-Barbosa
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {pendingCount} {pendingCount === 1 ? 'pendente' : 'pendentes'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Agenda Semanal & Sincronização em Tempo Real
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Google Sync Button */}
            <button
              type="button"
              id="btn-open-google-sync"
              onClick={onOpenGoogleSyncModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                googleUser && googleAccessToken
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                  : 'bg-white dark:bg-[#16161e] border-slate-200 dark:border-[#23232e] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f1f27]'
              }`}
              title="Sincronizar com Google Calendar"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">
                {googleUser ? 'Google Conectado' : 'Google Calendar'}
              </span>
            </button>

            {/* Share / WhatsApp Button */}
            <button
              type="button"
              id="btn-open-share"
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f1f27] transition-colors"
              title="Compartilhar agenda da semana (WhatsApp / .ICS)"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Compartilhar</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              id="btn-toggle-theme"
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-[#23232e] bg-white dark:bg-[#16161e] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f1f27] transition-colors"
              title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Create Event Header Button (Visible on mobile/tablet) */}
            <button
              type="button"
              id="btn-create-event-header"
              onClick={onOpenNewEventModal}
              className="lg:hidden flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_12px_rgba(79,70,229,0.4)] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Novo</span>
            </button>
          </div>
        </div>

        {/* Second Row: Week Navigation & Member Filters & View Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/60 dark:border-[#1f1f27]">
          {/* Week Selector */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="btn-prev-week"
              onClick={onPrevWeek}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-[#23232e] bg-white dark:bg-[#16161e] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f1f27] transition-colors"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="btn-today"
              onClick={onToday}
              className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-[#23232e] bg-white dark:bg-[#16161e] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f1f27] transition-colors"
            >
              Hoje
            </button>

            <button
              type="button"
              id="btn-next-week"
              onClick={onNextWeek}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-[#23232e] bg-white dark:bg-[#16161e] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f1f27] transition-colors"
              title="Próxima semana"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#f1f1f5] ml-1.5">
              {weekTitle}
            </span>
          </div>

          {/* Right Section: Mobile Member Filter Strip + View Switcher */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {/* Member Filter Chips for mobile / tablet */}
            <div className="lg:hidden flex items-center gap-1 overflow-x-auto pb-0.5 max-w-[280px] sm:max-w-none">
              <button
                type="button"
                id="filter-member-all"
                onClick={() => onSelectMember('all')}
                className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium transition-all ${
                  selectedMemberId === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-[#16161e] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1f1f27]'
                }`}
              >
                <span>👨‍👩‍👧‍👦</span>
                <span>Todos</span>
              </button>

              {members.map(m => (
                <button
                  key={m.id}
                  type="button"
                  id={`filter-member-${m.id}`}
                  onClick={() => onSelectMember(m.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium transition-all ${
                    selectedMemberId === m.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-[#16161e] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1f1f27]'
                  }`}
                  title={`${m.name} (${m.role})`}
                >
                  <span>{m.avatar}</span>
                  <span className="hidden md:inline">{m.name}</span>
                </button>
              ))}

              <button
                type="button"
                id="btn-open-members-modal"
                onClick={onOpenMembersModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-[#16161e] transition-colors"
                title="Gerenciar membros da família"
              >
                <Users className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e]">
              <button
                type="button"
                id="view-mode-week"
                onClick={() => onChangeViewMode('week')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-[#0d0d12] text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-[#1f1f27]'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title="Visualização semanal"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Semana</span>
              </button>

              <button
                type="button"
                id="view-mode-day"
                onClick={() => onChangeViewMode('day')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === 'day'
                    ? 'bg-white dark:bg-[#0d0d12] text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-[#1f1f27]'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title="Visualização diária"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Dia</span>
              </button>

              <button
                type="button"
                id="view-mode-list"
                onClick={() => onChangeViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-[#0d0d12] text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-[#1f1f27]'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title="Visualização em lista"
              >
                <List className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Lista</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

