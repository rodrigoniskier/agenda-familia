/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CalendarEvent, FamilyMember, ViewMode, ThemeMode } from './types';
import {
  loadStoredEvents,
  saveStoredEvents,
  loadStoredMembers,
  saveStoredMembers,
  loadStoredTheme,
  saveStoredTheme,
  loadNotificationsEnabled,
  saveNotificationsEnabled,
  loadLastGoogleSyncTime,
  saveLastGoogleSyncTime,
} from './services/storage';
import { getWeekDates, formatDateToISO } from './utils/dateUtils';
import { initAuth } from './services/auth';
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from './services/googleCalendar';
import { User } from 'firebase/auth';

import { Header } from './components/Header';
import { UpcomingRemindersBar } from './components/UpcomingRemindersBar';
import { WeeklyGrid } from './components/WeeklyGrid';
import { DayView } from './components/DayView';
import { ListView } from './components/ListView';
import { EventModal } from './components/EventModal';
import { FamilyMembersModal } from './components/FamilyMembersModal';
import { ShareExportModal } from './components/ShareExportModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import {
  Plus,
  Users,
  Cloud,
  CheckCircle2,
  Calendar as CalendarIcon,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Share2,
  Grid3X3,
  CalendarDays,
  List
} from 'lucide-react';

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<ThemeMode>(loadStoredTheme);

  // Members State
  const [members, setMembers] = useState<FamilyMember[]>(loadStoredMembers);

  // Events State
  const [events, setEvents] = useState<CalendarEvent[]>(() => loadStoredEvents(members));

  // Current calendar navigation date
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());

  // Filters & Views
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(loadNotificationsEnabled);

  // Google Calendar Auth State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(loadLastGoogleSyncTime);

  // Modals
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [defaultModalDate, setDefaultModalDate] = useState<string | undefined>(undefined);

  // Apply dark mode class to HTML element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveStoredTheme(theme);
  }, [theme]);

  // Save events whenever updated
  useEffect(() => {
    saveStoredEvents(events);
  }, [events]);

  // Save members whenever updated
  useEffect(() => {
    saveStoredMembers(members);
  }, [members]);

  // Save notifications preference
  useEffect(() => {
    saveNotificationsEnabled(notificationsEnabled);
  }, [notificationsEnabled]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Calendar week calculation
  const currentWeekDays = getWeekDates(referenceDate, true);

  const handlePrevWeek = () => {
    const nextD = new Date(referenceDate);
    nextD.setDate(nextD.getDate() - 7);
    setReferenceDate(nextD);
  };

  const handleNextWeek = () => {
    const nextD = new Date(referenceDate);
    nextD.setDate(nextD.getDate() + 7);
    setReferenceDate(nextD);
  };

  const handleToday = () => {
    setReferenceDate(new Date());
  };

  // Event Handlers
  const handleOpenNewEvent = (dateStr?: string) => {
    setEventToEdit(null);
    setDefaultModalDate(dateStr || formatDateToISO(new Date()));
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEventToEdit(event);
    setDefaultModalDate(event.date);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (event: CalendarEvent, syncWithGoogle: boolean) => {
    let updatedEvent = { ...event };

    // If Google Sync requested and we have token
    if (syncWithGoogle && googleAccessToken) {
      try {
        const member = members.find(m => m.id === event.memberId);
        const memberName = member ? member.name : 'Toda a Família';

        if (event.googleEventId) {
          await updateGoogleCalendarEvent(googleAccessToken, event.googleEventId, event, memberName);
        } else {
          const gId = await createGoogleCalendarEvent(googleAccessToken, event, memberName);
          updatedEvent.googleEventId = gId;
          updatedEvent.isSyncedWithGoogle = true;
        }
      } catch (err) {
        console.warn('Google Calendar sync failed for single event:', err);
      }
    }

    setEvents(prev => {
      const exists = prev.some(e => e.id === updatedEvent.id);
      if (exists) {
        return prev.map(e => (e.id === updatedEvent.id ? updatedEvent : e));
      }
      return [...prev, updatedEvent];
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    const toDelete = events.find(e => e.id === eventId);
    if (toDelete?.googleEventId && googleAccessToken) {
      try {
        await deleteGoogleCalendarEvent(googleAccessToken, toDelete.googleEventId);
      } catch (err) {
        console.warn('Google event delete error:', err);
      }
    }

    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const handleToggleComplete = (eventId: string) => {
    setEvents(prev =>
      prev.map(e => (e.id === eventId ? { ...e, completed: !e.completed } : e))
    );
  };

  const handleImportGoogleEvents = (newEvents: CalendarEvent[]) => {
    setEvents(prev => [...prev, ...newEvents]);
  };

  const handleUpdateSingleEvent = (updated: CalendarEvent) => {
    setEvents(prev => prev.map(e => (e.id === updated.id ? updated : e)));
  };

  const handleSetLastSyncTime = (timeIso: string) => {
    setLastSyncTime(timeIso);
    saveLastGoogleSyncTime(timeIso);
  };

  const getMemberGradient = (color: string) => {
    switch (color) {
      case 'rose':
        return 'from-rose-500 to-pink-500';
      case 'blue':
        return 'from-sky-500 to-indigo-500';
      case 'emerald':
        return 'from-emerald-500 to-teal-500';
      case 'amber':
        return 'from-amber-500 to-orange-500';
      case 'purple':
        return 'from-purple-500 to-indigo-500';
      case 'teal':
        return 'from-teal-500 to-emerald-500';
      case 'orange':
        return 'from-orange-500 to-rose-500';
      default:
        return 'from-indigo-500 to-purple-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070709] dark:bg-[radial-gradient(circle_at_50%_0%,#1a1a2e_0%,#070709_70%)] text-slate-900 dark:text-[#e0e0e6] transition-colors flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        currentWeekDays={currentWeekDays}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        members={members}
        selectedMemberId={selectedMemberId}
        onSelectMember={setSelectedMemberId}
        onOpenMembersModal={() => setIsMembersModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenGoogleSyncModal={() => setIsGoogleModalOpen(true)}
        onOpenNewEventModal={() => handleOpenNewEvent()}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        googleUser={googleUser}
        googleAccessToken={googleAccessToken}
        pendingCount={events.filter(e => !e.completed).length}
      />

      {/* Main App Layout: Sidebar on Desktop + Content View */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-4 gap-4">
        {/* Left Sidebar on large screens */}
        <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-white/70 dark:bg-[#0d0d12]/90 border border-slate-200 dark:border-[#1f1f27] rounded-2xl p-4 gap-4 h-fit sticky top-20 shadow-xs">
          {/* Quick Action Button */}
          <button
            type="button"
            id="btn-sidebar-add-event"
            onClick={() => handleOpenNewEvent()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Compromisso</span>
          </button>

          {/* Members List in Sidebar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Membros da Família
              </span>
              <button
                type="button"
                onClick={() => setIsMembersModalOpen(true)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                title="Editar membros"
              >
                <Users className="w-3 h-3" />
                <span>Gerenciar</span>
              </button>
            </div>

            <div className="space-y-1">
              {/* All Members Option */}
              <button
                type="button"
                onClick={() => setSelectedMemberId('all')}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedMemberId === 'all'
                    ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#16161e] border border-transparent'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                  👨‍👩‍👧‍👦
                </div>
                <span className="truncate flex-1 text-left">Toda a Família</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {events.length}
                </span>
              </button>

              {/* Individual Members */}
              {members.map(member => {
                const memberEventsCount = events.filter(e => e.memberId === member.id).length;
                const isSelected = selectedMemberId === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#16161e] border border-transparent'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-gradient-to-tr ${getMemberGradient(
                        member.color
                      )} flex items-center justify-center text-[10px] text-white font-bold shadow-xs`}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate flex-1 text-left">
                      <p className="truncate leading-none">{member.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                        {member.role}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {memberEventsCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Google Calendar Status Card */}
          <div className="mt-auto p-3 rounded-xl bg-slate-100/80 dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Google Calendar
              </span>
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  googleUser ? 'bg-emerald-400' : 'bg-slate-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  googleUser ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-400'
                }`} />
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              {googleUser ? (
                <span className="truncate block">{googleUser.displayName || googleUser.email}</span>
              ) : (
                'Agenda desconectada'
              )}
            </p>

            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(true)}
              className="w-full py-1.5 px-2.5 rounded-lg text-[11px] font-semibold bg-white dark:bg-[#0d0d12] hover:bg-slate-50 dark:hover:bg-[#1f1f27] border border-slate-200 dark:border-[#23232e] text-indigo-600 dark:text-indigo-400 transition-colors flex items-center justify-center gap-1.5"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>{googleUser ? 'Gerenciar Sync' : 'Conectar Google'}</span>
            </button>
          </div>
        </aside>

        {/* Center Main Views */}
        <main className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Reminders / Agenda Preview Strip */}
          <UpcomingRemindersBar
            events={events}
            members={members}
            onSelectEvent={handleEditEvent}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={setNotificationsEnabled}
          />

          {/* View Mode Component Switcher */}
          {viewMode === 'week' && (
            <WeeklyGrid
              weekDays={currentWeekDays}
              events={events}
              members={members}
              selectedMemberId={selectedMemberId}
              onSelectEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
              onToggleComplete={handleToggleComplete}
              onAddEventOnDay={handleOpenNewEvent}
            />
          )}

          {viewMode === 'day' && (
            <DayView
              weekDays={currentWeekDays}
              events={events}
              members={members}
              selectedMemberId={selectedMemberId}
              onSelectEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
              onToggleComplete={handleToggleComplete}
              onAddEventOnDay={handleOpenNewEvent}
            />
          )}

          {viewMode === 'list' && (
            <ListView
              weekDays={currentWeekDays}
              events={events}
              members={members}
              selectedMemberId={selectedMemberId}
              onSelectEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
              onToggleComplete={handleToggleComplete}
              onAddNewEvent={() => handleOpenNewEvent()}
            />
          )}
        </main>
      </div>

      {/* Immersive Footer with Category Legend & Sync Status */}
      <footer className="bg-white/70 dark:bg-[#0d0d12]/80 border-t border-slate-200 dark:border-[#1f1f27] px-4 py-3 mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          {/* Category Dot Indicators */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Legenda:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
              <span>Trabalho</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.6)]" />
              <span>Lazer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              <span>Saúde</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
              <span>Escola</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
              <span>Família</span>
            </div>
          </div>

          {/* System Status readout */}
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SINCRONIZAÇÃO EM TEMPO REAL
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{theme === 'dark' ? 'MODO ESCURO ATIVO' : 'MODO CLARO ATIVO'}</span>
          </div>
        </div>
      </footer>

      {/* Floating Action Button for Mobile */}
      <div className="lg:hidden fixed bottom-5 right-5 z-40">
        <button
          type="button"
          id="btn-mobile-add-event"
          onClick={() => handleOpenNewEvent()}
          className="w-13 h-13 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.5)] flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
          title="Novo Compromisso"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        eventToEdit={eventToEdit}
        defaultDate={defaultModalDate}
        members={members}
        isGoogleConnected={!!(googleUser && googleAccessToken)}
      />

      <FamilyMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        members={members}
        onSaveMembers={setMembers}
      />

      <ShareExportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        events={events}
        members={members}
        weekDays={currentWeekDays}
      />

      <GoogleSyncModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        user={googleUser}
        accessToken={googleAccessToken}
        onAuthSuccess={(user, token) => {
          setGoogleUser(user);
          setGoogleAccessToken(token);
        }}
        onLogout={() => {
          setGoogleUser(null);
          setGoogleAccessToken(null);
        }}
        events={events}
        members={members}
        weekDays={currentWeekDays}
        onImportEvents={handleImportGoogleEvents}
        onUpdateEvent={handleUpdateSingleEvent}
        lastSyncTime={lastSyncTime}
        onSetLastSyncTime={handleSetLastSyncTime}
      />
    </div>
  );
}

