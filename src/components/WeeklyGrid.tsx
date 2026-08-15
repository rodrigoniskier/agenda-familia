import React from 'react';
import { CalendarEvent, FamilyMember, WeekDay } from '../types';
import { EventCard } from './EventCard';
import { Plus } from 'lucide-react';
import { sortEventsByTime } from '../utils/dateUtils';

interface WeeklyGridProps {
  weekDays: WeekDay[];
  events: CalendarEvent[];
  members: FamilyMember[];
  selectedMemberId: string;
  onSelectEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onToggleComplete: (eventId: string) => void;
  onAddEventOnDay: (dateString: string) => void;
}

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({
  weekDays,
  events,
  members,
  selectedMemberId,
  onSelectEvent,
  onDeleteEvent,
  onToggleComplete,
  onAddEventOnDay,
}) => {
  // Filter events by member if selected
  const filteredEvents = events.filter(event => {
    if (selectedMemberId === 'all') return true;
    return event.memberId === selectedMemberId || event.memberId === 'all';
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5">
      {weekDays.map((day) => {
        const dayEvents = sortEventsByTime(
          filteredEvents.filter(e => e.date === day.dateString)
        );

        return (
          <div
            key={day.dateString}
            id={`day-column-${day.dateString}`}
            className={`flex flex-col rounded-2xl border transition-all duration-200 min-h-[380px] ${
              day.isToday
                ? 'bg-slate-100/90 dark:bg-[#0d0d12]/80 border-indigo-500/50 dark:border-indigo-500/40 shadow-[0_0_20px_rgba(79,70,229,0.12)] ring-1 ring-indigo-500/30'
                : 'bg-white/80 dark:bg-[#0d0d12]/50 border-slate-200 dark:border-[#1f1f27] hover:border-slate-300 dark:hover:border-[#2a2a38]'
            }`}
          >
            {/* Day Header */}
            <div className="p-3 pb-2 text-center relative border-b border-slate-100 dark:border-[#1f1f27]/60">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${
                  day.isToday
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {day.dayName}
              </span>

              {day.isToday ? (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-base flex items-center justify-center mx-auto shadow-[0_0_12px_rgba(79,70,229,0.5)]">
                  {day.dayNumber}
                </div>
              ) : (
                <span className="text-lg font-bold text-slate-800 dark:text-white block">
                  {day.dayNumber}
                </span>
              )}

              {/* Quick Add icon */}
              <button
                type="button"
                id={`add-event-day-${day.dateString}`}
                onClick={() => onAddEventOnDay(day.dateString)}
                className="absolute top-2.5 right-2 p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-[#16161e] transition-colors"
                title={`Adicionar em ${day.dayName}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Events List */}
            <div className="p-2 flex-1 flex flex-col gap-2 overflow-y-auto max-h-[520px]">
              {dayEvents.length === 0 ? (
                <div
                  onClick={() => onAddEventOnDay(day.dateString)}
                  className="flex-1 flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-[#23232e] text-slate-400 dark:text-slate-600 hover:border-indigo-400/50 dark:hover:border-indigo-500/40 hover:bg-indigo-50/20 dark:hover:bg-[#16161e]/40 cursor-pointer transition-all min-h-[120px]"
                >
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Sem eventos</p>
                  <span className="mt-1 text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 font-semibold">
                    <Plus className="w-3 h-3" /> Adicionar
                  </span>
                </div>
              ) : (
                dayEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    members={members}
                    onEdit={onSelectEvent}
                    onDelete={onDeleteEvent}
                    onToggleComplete={onToggleComplete}
                    compact={false}
                  />
                ))
              )}
            </div>

            {/* Day Footer with count */}
            {dayEvents.length > 0 && (
              <div className="px-3 py-1.5 border-t border-slate-100 dark:border-[#1f1f27]/60 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between font-medium">
                <span>
                  {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
                </span>
                {dayEvents.filter(e => e.completed).length > 0 && (
                  <span className="text-emerald-500 dark:text-emerald-400">
                    {dayEvents.filter(e => e.completed).length} feito
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

