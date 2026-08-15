import React, { useState } from 'react';
import { CalendarEvent, FamilyMember, WeekDay } from '../types';
import { EventCard } from './EventCard';
import { PT_DAYS_FULL, sortEventsByTime, formatDateToISO } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';

interface DayViewProps {
  weekDays: WeekDay[];
  events: CalendarEvent[];
  members: FamilyMember[];
  selectedMemberId: string;
  onSelectEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onToggleComplete: (eventId: string) => void;
  onAddEventOnDay: (dateString: string) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  weekDays,
  events,
  members,
  selectedMemberId,
  onSelectEvent,
  onDeleteEvent,
  onToggleComplete,
  onAddEventOnDay,
}) => {
  const todayStr = formatDateToISO(new Date());
  const initialIndex = Math.max(0, weekDays.findIndex(d => d.dateString === todayStr));
  const [selectedDayIndex, setSelectedDayIndex] = useState(initialIndex !== -1 ? initialIndex : 0);

  const currentDay = weekDays[selectedDayIndex] || weekDays[0];

  const filteredEvents = events.filter(e => {
    if (e.date !== currentDay?.dateString) return false;
    if (selectedMemberId !== 'all' && e.memberId !== selectedMemberId && e.memberId !== 'all') return false;
    return true;
  });

  const dayEvents = sortEventsByTime(filteredEvents);

  const [y, m, d] = currentDay.dateString.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const fullDayName = PT_DAYS_FULL[dateObj.getDay()];

  return (
    <div className="w-full space-y-4">
      {/* Day Selector Navigation Bar */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-white/70 dark:bg-[#0d0d12]/90 border border-slate-200 dark:border-[#1f1f27]">
        <button
          type="button"
          onClick={() => setSelectedDayIndex(prev => Math.max(0, prev - 1))}
          disabled={selectedDayIndex === 0}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#16161e] disabled:opacity-30 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {weekDays.map((day, idx) => (
            <button
              key={day.dateString}
              type="button"
              onClick={() => setSelectedDayIndex(idx)}
              className={`flex flex-col items-center px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                selectedDayIndex === idx
                  ? 'bg-indigo-600 text-white font-bold shadow-[0_0_12px_rgba(79,70,229,0.4)]'
                  : day.isToday
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#16161e]'
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider">{day.dayName}</span>
              <span className="text-sm font-bold">{day.dayNumber}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSelectedDayIndex(prev => Math.min(weekDays.length - 1, prev + 1))}
          disabled={selectedDayIndex === weekDays.length - 1}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#16161e] disabled:opacity-30 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Main Day View Panel */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1f1f27] bg-white/80 dark:bg-[#0d0d12]/80 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-[#1f1f27]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {fullDayName}, {currentDay.dayNumber} de {currentDay.monthName}
              </h3>
              {currentDay.isToday && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-[0_0_8px_rgba(79,70,229,0.5)]">
                  HOJE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {dayEvents.length} {dayEvents.length === 1 ? 'compromisso programado' : 'compromissos programados'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onAddEventOnDay(currentDay.dateString)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.3)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Compromisso</span>
          </button>
        </div>

        {dayEvents.length === 0 ? (
          <div className="py-14 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e] flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 shadow-xs">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
              Nenhum compromisso para este dia
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Mantenha os membros da família alinhados adicionando tarefas, consultas ou passeios.
            </p>
            <button
              type="button"
              onClick={() => onAddEventOnDay(currentDay.dateString)}
              className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-[#16161e] transition-colors cursor-pointer"
            >
              + Criar compromisso
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dayEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                members={members}
                onEdit={onSelectEvent}
                onDelete={onDeleteEvent}
                onToggleComplete={onToggleComplete}
                compact={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

