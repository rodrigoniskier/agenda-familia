import React, { useState } from 'react';
import { CalendarEvent, FamilyMember, WeekDay, EventCategory } from '../types';
import { CATEGORIES } from '../constants';
import { EventCard } from './EventCard';
import { PT_DAYS_FULL, sortEventsByTime } from '../utils/dateUtils';
import { Search, Plus, CalendarCheck2 } from 'lucide-react';

interface ListViewProps {
  weekDays: WeekDay[];
  events: CalendarEvent[];
  members: FamilyMember[];
  selectedMemberId: string;
  onSelectEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onToggleComplete: (eventId: string) => void;
  onAddNewEvent: () => void;
}

export const ListView: React.FC<ListViewProps> = ({
  weekDays,
  events,
  members,
  selectedMemberId,
  onSelectEvent,
  onDeleteEvent,
  onToggleComplete,
  onAddNewEvent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter events
  const filteredEvents = events.filter(e => {
    // Member filter
    if (selectedMemberId !== 'all' && e.memberId !== selectedMemberId && e.memberId !== 'all') {
      return false;
    }
    // Category filter
    if (selectedCategory !== 'all' && e.category !== selectedCategory) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchDesc = e.description?.toLowerCase().includes(q);
      const matchLoc = e.location?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc) return false;
    }
    return true;
  });

  return (
    <div className="w-full space-y-4">
      {/* Search and Category Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/70 dark:bg-[#0d0d12]/90 border border-slate-200 dark:border-[#1f1f27]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="search-events-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por compromisso, local ou anotação..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]'
                : 'bg-slate-100 dark:bg-[#16161e] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1f1f27]'
            }`}
          >
            Todas Categorias
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]'
                  : 'bg-slate-100 dark:bg-[#16161e] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1f1f27]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped by Day */}
      <div className="space-y-4">
        {weekDays.map(day => {
          const dayEvents = sortEventsByTime(
            filteredEvents.filter(e => e.date === day.dateString)
          );

          if (dayEvents.length === 0 && (searchQuery || selectedCategory !== 'all')) {
            return null; // hide empty days when filtering
          }

          const [y, m, d] = day.dateString.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
          const fullDayName = PT_DAYS_FULL[dateObj.getDay()];

          return (
            <div
              key={day.dateString}
              className="rounded-2xl border border-slate-200 dark:border-[#1f1f27] bg-white/70 dark:bg-[#0d0d12]/80 p-4 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1f1f27]">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      day.isToday
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-800 dark:text-white'
                    }`}
                  >
                    {fullDayName}, {day.dayNumber} de {day.monthName}
                  </span>
                  {day.isToday && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-[0_0_8px_rgba(79,70,229,0.5)]">
                      HOJE
                    </span>
                  )}
                </div>

                <span className="text-xs text-slate-400 font-medium">
                  {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
                </span>
              </div>

              {dayEvents.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-2">
                  Nenhum compromisso marcado para este dia.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
          );
        })}
      </div>
    </div>
  );
};

