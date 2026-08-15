/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { CalendarEvent, FamilyMember, ThemeMode, ViewMode } from './types';
import { INITIAL_MEMBERS } from './constants';
import { getWeekDates, formatDateToISO } from './utils/dateUtils';
import { initAuth } from './services/auth';
import {
  initializeCloudAgenda,
  subscribeCloudEvents,
  subscribeCloudMembers,
  upsertCloudEvent,
  upsertCloudEvents,
  deleteCloudEvent,
  replaceCloudMembers,
} from './services/cloudStorage';
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from './services/googleCalendar';

import { Header } from './components/Header';
import { UpcomingRemindersBar } from './components/UpcomingRemindersBar';
import { WeeklyGrid } from './components/WeeklyGrid';
import { DayView } from './components/DayView';
import { ListView } from './components/ListView';
import { EventModal } from './components/EventModal';
import { FamilyMembersModal } from './components/FamilyMembersModal';
import { ShareExportModal } from './components/ShareExportModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { Cloud, Plus, Users } from 'lucide-react';

function initialTheme(): ThemeMode {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export default function AppRealtime() {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);
  const [members, setMembers] = useState<FamilyMember[]>(INITIAL_MEMBERS);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const [cloudReady, setCloudReady] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [defaultModalDate, setDefaultModalDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeEvents: (() => void) | undefined;
    let unsubscribeMembers: (() => void) | undefined;

    const start = async () => {
      try {
        setCloudError(null);
        await initializeCloudAgenda();
        if (cancelled) return;

        unsubscribeEvents = subscribeCloudEvents(
          (nextEvents) => {
            setEvents(nextEvents);
            setCloudReady(true);
          },
          (error) => {
            console.error('Firestore events listener error:', error);
            setCloudError('Não foi possível manter a agenda sincronizada com a nuvem.');
          },
        );

        unsubscribeMembers = subscribeCloudMembers(
          setMembers,
          (error) => {
            console.error('Firestore members listener error:', error);
            setCloudError('Não foi possível sincronizar os membros da família.');
          },
        );
      } catch (error: any) {
        console.error('Cloud agenda initialization failed:', error);
        if (!cancelled) {
          setCloudError(
            error?.code === 'permission-denied'
              ? 'O Firestore está sem permissão de acesso. Verifique as regras do banco.'
              : 'Não foi possível conectar ao armazenamento on-line da família.',
          );
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      unsubscribeEvents?.();
      unsubscribeMembers?.();
    };
  }, []);

  // Google Calendar authentication remains optional and separate from Firestore storage.
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
      },
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const currentWeekDays = getWeekDates(referenceDate, true);

  const handlePrevWeek = () => {
    const next = new Date(referenceDate);
    next.setDate(next.getDate() - 7);
    setReferenceDate(next);
  };

  const handleNextWeek = () => {
    const next = new Date(referenceDate);
    next.setDate(next.getDate() + 7);
    setReferenceDate(next);
  };

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
    let updatedEvent: CalendarEvent = { ...event, updatedAt: Date.now() };

    if (syncWithGoogle && googleAccessToken) {
      try {
        const member = members.find((item) => item.id === event.memberId);
        const memberName = member ? member.name : 'Toda a Família';

        if (event.googleEventId) {
          await updateGoogleCalendarEvent(googleAccessToken, event.googleEventId, updatedEvent, memberName);
        } else {
          const googleEventId = await createGoogleCalendarEvent(
            googleAccessToken,
            updatedEvent,
            memberName,
          );
          updatedEvent = {
            ...updatedEvent,
            googleEventId,
            isSyncedWithGoogle: true,
          };
        }
      } catch (error) {
        console.warn('Google Calendar sync failed for single event:', error);
      }
    }

    try {
      await upsertCloudEvent(updatedEvent);
      setIsEventModalOpen(false);
    } catch (error) {
      console.error('Cloud event save error:', error);
      setCloudError('Não foi possível salvar este compromisso na nuvem.');
      throw error;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const event = events.find((item) => item.id === eventId);
    if (event?.googleEventId && googleAccessToken) {
      try {
        await deleteGoogleCalendarEvent(googleAccessToken, event.googleEventId);
      } catch (error) {
        console.warn('Google event delete error:', error);
      }
    }

    try {
      await deleteCloudEvent(eventId);
    } catch (error) {
      console.error('Cloud event delete error:', error);
      setCloudError('Não foi possível excluir este compromisso da nuvem.');
    }
  };

  const handleToggleComplete = async (eventId: string) => {
    const event = events.find((item) => item.id === eventId);
    if (!event) return;

    try {
      await upsertCloudEvent({
        ...event,
        completed: !event.completed,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Cloud event update error:', error);
      setCloudError('Não foi possível atualizar este compromisso.');
    }
  };

  const handleImportGoogleEvents = async (newEvents: CalendarEvent[]) => {
    try {
      await upsertCloudEvents(newEvents);
    } catch (error) {
      console.error('Cloud Google import error:', error);
      setCloudError('Não foi possível importar os compromissos para a agenda compartilhada.');
    }
  };

  const handleUpdateSingleEvent = async (updated: CalendarEvent) => {
    try {
      await upsertCloudEvent({ ...updated, updatedAt: Date.now() });
    } catch (error) {
      console.error('Cloud single event update error:', error);
      setCloudError('Não foi possível atualizar este compromisso na nuvem.');
    }
  };

  const handleSaveMembers = async (nextMembers: FamilyMember[]) => {
    try {
      await replaceCloudMembers(nextMembers);
      setIsMembersModalOpen(false);
    } catch (error) {
      console.error('Cloud members save error:', error);
      setCloudError('Não foi possível atualizar os membros da família na nuvem.');
    }
  };

  const getMemberGradient = (color: string) => {
    switch (color) {
      case 'rose': return 'from-rose-500 to-pink-500';
      case 'blue': return 'from-sky-500 to-indigo-500';
      case 'emerald': return 'from-emerald-500 to-teal-500';
      case 'amber': return 'from-amber-500 to-orange-500';
      case 'purple': return 'from-purple-500 to-indigo-500';
      case 'teal': return 'from-teal-500 to-emerald-500';
      case 'orange': return 'from-orange-500 to-rose-500';
      default: return 'from-indigo-500 to-purple-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070709] dark:bg-[radial-gradient(circle_at_50%_0%,#1a1a2e_0%,#070709_70%)] text-slate-900 dark:text-[#e0e0e6] transition-colors flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Header
        currentWeekDays={currentWeekDays}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={() => setReferenceDate(new Date())}
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
        onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        googleUser={googleUser}
        googleAccessToken={googleAccessToken}
        pendingCount={events.filter((event) => !event.completed).length}
      />

      {!cloudReady && !cloudError && (
        <div className="mx-auto mt-3 max-w-[1600px] w-[calc(100%-1.5rem)] rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-2 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Conectando à agenda compartilhada em tempo real…
        </div>
      )}

      {cloudError && (
        <div className="mx-auto mt-3 max-w-[1600px] w-[calc(100%-1.5rem)] rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-700 dark:text-rose-300">
          {cloudError}
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-4 gap-4">
        <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-white/70 dark:bg-[#0d0d12]/90 border border-slate-200 dark:border-[#1f1f27] rounded-2xl p-4 gap-4 h-fit sticky top-20 shadow-xs">
          <button
            type="button"
            id="btn-sidebar-add-event"
            onClick={() => handleOpenNewEvent()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Compromisso</span>
          </button>

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
                <span className="text-[10px] text-slate-400 font-normal">{events.length}</span>
              </button>

              {members.map((member) => {
                const memberEventsCount = events.filter((event) => event.memberId === member.id).length;
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
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${getMemberGradient(member.color)} flex items-center justify-center text-[10px] text-white font-bold shadow-xs`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate flex-1 text-left">
                      <p className="truncate leading-none">{member.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">{member.role}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">{memberEventsCount}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Agenda em nuvem</span>
              <span className={`w-2 h-2 rounded-full ${cloudReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              {cloudReady ? 'Rodrigo, Erika e Sophia sincronizados em tempo real.' : 'Conectando…'}
            </p>
          </div>

          <div className="mt-auto p-3 rounded-xl bg-slate-100/80 dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Google Calendar</span>
              <span className={`w-2 h-2 rounded-full ${googleUser ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              {googleUser ? (googleUser.displayName || googleUser.email) : 'Sincronização opcional'}
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

        <main className="flex-1 flex flex-col gap-4 min-w-0">
          <UpcomingRemindersBar
            events={events}
            members={members}
            onSelectEvent={handleEditEvent}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={setNotificationsEnabled}
          />

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

      <footer className="bg-white/70 dark:bg-[#0d0d12]/80 border-t border-slate-200 dark:border-[#1f1f27] px-4 py-3 mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>Agenda Família • Rodrigo, Erika e Sophia</span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className={`flex items-center gap-1.5 font-semibold ${cloudReady ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cloudReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              {cloudReady ? 'FIRESTORE EM TEMPO REAL' : 'CONECTANDO À NUVEM'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{theme === 'dark' ? 'MODO ESCURO' : 'MODO CLARO'}</span>
          </div>
        </div>
      </footer>

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
        onSaveMembers={handleSaveMembers}
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
        onSetLastSyncTime={setLastSyncTime}
      />
    </div>
  );
}
