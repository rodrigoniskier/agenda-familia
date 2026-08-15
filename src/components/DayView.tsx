import React, { useEffect, useState } from 'react';
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
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
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
  onPrevWeek,
  onNextWeek,
}) => {
  const todayStr = formatDateToISO(new Date());
  const foundIndex = weekDays.findIndex((day) => day.dateString === todayStr);
  const [selectedDayIndex, setSelectedDayIndex] = useState(foundIndex >= 0 ? foundIndex : 0);

  useEffect(() => {
    setSelectedDayIndex((current) => Math.min(current, Math.max(weekDays.length - 1, 0)));
  }, [weekDays]);

  const currentDay = weekDays[selectedDayIndex] || weekDays[0];
  if (!currentDay) return null;

  const filteredEvents = events.filter((event) => {
    if (event.date !== currentDay.dateString) return false;
    if (selectedMemberId !== 'all' && event.memberId !== selectedMemberId && event.memberId !== 'all') return false;
    return true;
  });

  const dayEvents = sortEventsByTime(filteredEvents);
  const [year, month, day] = currentDay.dateString.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const fullDayName = PT_DAYS_FULL[dateObj.getDay()];

  const changeWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (onPrevWeek) onPrevWeek();
      else document.getElementById('btn-prev-week')?.click();
      return;
    }
    if (onNextWeek) onNextWeek();
    else document.getElementById('btn-next-week')?.click();
  };

  const goPreviousDay = () => {
    if (selectedDayIndex > 0) {
      setSelectedDayIndex((previous) => previous - 1);
      return;
    }
    changeWeek('prev');
    setSelectedDayIndex(Math.max(weekDays.length - 1, 0));
  };

  const goNextDay = () => {
    if (selectedDayIndex < weekDays.length - 1) {
      setSelectedDayIndex((previous) => previous + 1);
      return;
    }
    changeWeek('next');
    setSelectedDayIndex(0);
  };

  return (
    <div id="day-view" className="w-full space-y-3 sm:space-y-4">
      <div id="day-selector" className="flex items-center justify-between p-1.5 sm:p-2 rounded-2xl bg-white/80 dark:bg-[#0d0d12]/90 border border-slate-200 dark:border-[#1f1f27]">
        <button
          type="button"
          onClick={goPreviousDay}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-[#16161e]"
          aria-label={selectedDayIndex === 0 ? 'Semana anterior' : 'Dia anterior'}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1 overflow-x-auto py-0.5 min-w-0">
          {weekDays.map((item, index) => (
            <button
              key={item.dateString}
              type="button"
              onClick={() => setSelectedDayIndex(index)}
              className={`flex flex-col items-center min-w-[42px] px-2 py-1.5 rounded-xl transition-all ${
                selectedDayIndex === index
                  ? 'bg-indigo-600 text-white font-bold'
                  : item.isToday
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="text-[9px] uppercase font-semibold">{item.dayName}</span>
              <span className="text-sm font-bold">{item.dayNumber}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={goNextDay}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-[#16161e]"
          aria-label={selectedDayIndex === weekDays.length - 1 ? 'Próxima semana' : 'Próximo dia'}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div id="day-panel" className="rounded-2xl border border-slate-200 dark:border-[#1f1f27] bg-white/85 dark:bg-[#0d0d12]/80 p-3 sm:p-5 shadow-xs">
        <div id="day-panel-header" className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100 dark:border-[#1f1f27]">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {fullDayName}, {currentDay.dayNumber} de {currentDay.monthName}
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
              {dayEvents.length} {dayEvents.length === 1 ? 'compromisso' : 'compromissos'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onAddEventOnDay(currentDay.dateString)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </div>

        {dayEvents.length === 0 ? (
          <div className="py-10 sm:py-14 flex flex-col items-center justify-center text-center">
            <Calendar className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Nenhum compromisso</p>
          </div>
        ) : (
          <div id="day-events-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {dayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                members={members}
                onEdit={onSelectEvent}
                onDelete={onDeleteEvent}
                onToggleComplete={onToggleComplete}
                compact={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
