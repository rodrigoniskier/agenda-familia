import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { CalendarEvent, FamilyMember } from './types';
import { INITIAL_MEMBERS } from './constants';
import {
  deleteCloudEvent,
  initializeCloudAgenda,
  subscribeCloudEvents,
  subscribeCloudMembers,
  upsertCloudEvent,
} from './services/cloudStorage';
import { MinimalEventModal } from './components/MinimalEventModal';

type Period = 'day' | 'week' | 'month';

const PERIOD_LABELS: Record<Period, string> = {
  day: 'Agenda do dia',
  week: 'Agenda da semana',
  month: 'Agenda do mês',
};

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

function iso(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function fromIso(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date): Date {
  const next = new Date(date);
  const weekday = next.getDay();
  const delta = weekday === 0 ? -6 : 1 - weekday;
  next.setDate(next.getDate() + delta);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDay(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

function formatDateShort(value: string): string {
  const date = fromIso(value);
  return `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

function timeLabel(event: CalendarEvent): string {
  if (event.isAllDay) return 'Dia inteiro';
  if (!event.startTime) return '';
  return event.endTime ? `${event.startTime}–${event.endTime}` : event.startTime;
}

function periodRange(period: Period, reference: Date): { start: Date; end: Date } {
  if (period === 'day') {
    const start = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
    return { start, end: start };
  }
  if (period === 'week') {
    const start = startOfWeek(reference);
    return { start, end: addDays(start, 6) };
  }
  return {
    start: new Date(reference.getFullYear(), reference.getMonth(), 1),
    end: new Date(reference.getFullYear(), reference.getMonth() + 1, 0),
  };
}

function periodTitle(period: Period, reference: Date): string {
  if (period === 'day') return formatDay(reference);
  if (period === 'week') {
    const start = startOfWeek(reference);
    const end = addDays(start, 6);
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}–${end.getDate()} de ${MONTHS[start.getMonth()]}`;
    }
    return `${start.getDate()} ${MONTHS[start.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]}`;
  }
  return `${MONTHS[reference.getMonth()]} ${reference.getFullYear()}`;
}

export default function MinimalApp() {
  const [members, setMembers] = useState<FamilyMember[]>(INITIAL_MEMBERS);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period | null>(null);
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventDate, setNewEventDate] = useState(iso(new Date()));

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    document.body.style.background = '#ffffff';

    void initializeCloudAgenda();
    const unsubscribeEvents = subscribeCloudEvents(setEvents, () => undefined);
    const unsubscribeMembers = subscribeCloudMembers(setMembers, () => undefined);
    return () => {
      unsubscribeEvents();
      unsubscribeMembers();
    };
  }, []);

  const profile = members.find((member) => member.id === profileId) || null;

  const visibleEvents = useMemo(() => {
    if (!profile || !period) return [];
    const { start, end } = periodRange(period, referenceDate);
    const startIso = iso(start);
    const endIso = iso(end);

    return events
      .filter((event) =>
        (event.memberId === profile.id || event.memberId === 'all') &&
        event.date >= startIso &&
        event.date <= endIso,
      )
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        if (a.isAllDay !== b.isAllDay) return a.isAllDay ? -1 : 1;
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
  }, [events, profile, period, referenceDate]);

  const groupedEvents = useMemo(() => {
    const groups = new Map<string, CalendarEvent[]>();
    for (const event of visibleEvents) {
      const group = groups.get(event.date) || [];
      group.push(event);
      groups.set(event.date, group);
    }
    return [...groups.entries()];
  }, [visibleEvents]);

  const changeReference = (direction: -1 | 1) => {
    if (!period) return;
    if (period === 'day') setReferenceDate((current) => addDays(current, direction));
    if (period === 'week') setReferenceDate((current) => addDays(current, 7 * direction));
    if (period === 'month') {
      setReferenceDate((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    }
  };

  const openNewEvent = () => {
    if (!period) return;
    const { start, end } = periodRange(period, referenceDate);
    const today = iso(new Date());
    const startIso = iso(start);
    const endIso = iso(end);
    setNewEventDate(today >= startIso && today <= endIso ? today : startIso);
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const saveEvent = async (event: CalendarEvent) => {
    try {
      await upsertCloudEvent(event);
      setEvents((current) => {
        const exists = current.some((item) => item.id === event.id);
        return exists
          ? current.map((item) => item.id === event.id ? event : item)
          : [...current, event];
      });
    } catch (error) {
      window.alert('Não foi possível salvar o compromisso. Tente novamente.');
      throw error;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await deleteCloudEvent(eventId);
      setEvents((current) => current.filter((item) => item.id !== eventId));
    } catch (error) {
      window.alert('Não foi possível excluir o compromisso. Tente novamente.');
      throw error;
    }
  };

  if (!profile) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-center text-xl font-semibold text-slate-900 mb-8">Quem vai usar a agenda?</h1>
          <div className="space-y-3">
            {members.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setProfileId(member.id)}
                className="w-full h-20 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] transition flex items-center px-5 gap-4 text-left"
              >
                <span className="text-3xl" aria-hidden="true">{member.avatar}</span>
                <span className="text-lg font-semibold text-slate-900">{member.name}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!period) {
    const choices: Array<{ period: Period; icon: React.ComponentType<{ className?: string }> }> = [
      { period: 'day', icon: CalendarDays },
      { period: 'week', icon: CalendarRange },
      { period: 'month', icon: Calendar },
    ];

    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-3xl mb-2">{profile.avatar}</div>
            <h1 className="text-xl font-semibold text-slate-900">{profile.name}</h1>
          </div>

          <div className="space-y-4">
            {choices.map(({ period: option, icon: Icon }) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setReferenceDate(new Date());
                  setPeriod(option);
                }}
                className="w-full h-28 rounded-3xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] transition flex flex-col items-center justify-center gap-2"
              >
                <Icon className="w-7 h-7 text-slate-700" />
                <span className="text-base font-semibold text-slate-900">{PERIOD_LABELS[option]}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setProfileId(null)}
            className="mx-auto mt-8 block text-sm text-slate-400 hover:text-slate-700"
          >
            Trocar perfil
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <header className="h-16 flex items-center justify-between border-b border-slate-100">
          <button
            type="button"
            onClick={() => setPeriod(null)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="text-sm font-semibold">{PERIOD_LABELS[period]}</div>
            <div className="text-xs text-slate-400">{profile.name}</div>
          </div>
          <div className="w-10" />
        </header>

        <div className="h-16 flex items-center justify-between">
          <button type="button" onClick={() => changeReference(-1)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Anterior">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => setReferenceDate(new Date())} className="text-sm font-medium text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-50">
            {periodTitle(period, referenceDate)}
          </button>
          <button type="button" onClick={() => changeReference(1)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Próximo">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <section className="pb-8">
          {visibleEvents.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">Nenhum compromisso.</div>
          ) : period === 'day' ? (
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {visibleEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => {
                    setEditingEvent(event);
                    setNewEventDate(event.date);
                    setIsModalOpen(true);
                  }}
                  className="w-full py-4 flex items-center gap-4 text-left hover:bg-slate-50"
                >
                  <span className="w-24 shrink-0 text-xs text-slate-400">{timeLabel(event)}</span>
                  <span className={`text-sm ${event.title === 'Livre' ? 'text-slate-400' : 'font-medium text-slate-900'}`}>{event.title}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-7">
              {groupedEvents.map(([date, dayEvents]) => (
                <div key={date}>
                  <h2 className="text-xs font-semibold text-slate-400 mb-2">{formatDateShort(date)}</h2>
                  <div className="divide-y divide-slate-100 border-t border-slate-100">
                    {dayEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => {
                          setEditingEvent(event);
                          setNewEventDate(event.date);
                          setIsModalOpen(true);
                        }}
                        className="w-full py-3.5 flex items-center gap-4 text-left hover:bg-slate-50"
                      >
                        <span className="w-24 shrink-0 text-xs text-slate-400">{timeLabel(event)}</span>
                        <span className={`text-sm ${event.title === 'Livre' ? 'text-slate-400' : 'font-medium text-slate-900'}`}>{event.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <button
        type="button"
        onClick={openNewEvent}
        className="fixed right-5 bottom-5 w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg active:scale-95 transition"
        aria-label="Adicionar compromisso"
      >
        <Plus className="w-6 h-6" />
      </button>

      <MinimalEventModal
        isOpen={isModalOpen}
        event={editingEvent}
        profile={profile}
        defaultDate={newEventDate}
        onClose={() => setIsModalOpen(false)}
        onSave={saveEvent}
        onDelete={deleteEvent}
      />
    </main>
  );
}
