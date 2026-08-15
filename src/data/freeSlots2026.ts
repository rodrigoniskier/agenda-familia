import { CalendarEvent } from '../types';

const MEMBER_IDS = ['m_rodrigo', 'm_erika', 'm_sophia'];
const START_DATE = '2026-08-16';
const END_DATE = '2026-12-18';
const DAY_START = '07:00';
const DAY_END = '22:00';
const CREATED_AT = new Date('2026-08-15T12:00:00-03:00').getTime();

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function toTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);

  while (cursor <= last) {
    dates.push([
      cursor.getFullYear(),
      String(cursor.getMonth() + 1).padStart(2, '0'),
      String(cursor.getDate()).padStart(2, '0'),
    ].join('-'));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function makeFreeEvent(memberId: string, date: string, startTime: string, endTime: string): CalendarEvent {
  return {
    id: `livre-${memberId}-${date}-${startTime.replace(':', '')}-${endTime.replace(':', '')}`,
    title: 'Livre',
    memberId,
    date,
    startTime,
    endTime,
    isAllDay: false,
    category: 'other',
    description: 'Horário disponível para futuro compromisso.',
    priority: 'low',
    reminderMinutes: 0,
    completed: false,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  };
}

export function generateFreeSlots(existingEvents: CalendarEvent[]): CalendarEvent[] {
  const freeEvents: CalendarEvent[] = [];
  const dayStart = toMinutes(DAY_START);
  const dayEnd = toMinutes(DAY_END);

  for (const date of dateRange(START_DATE, END_DATE)) {
    for (const memberId of MEMBER_IDS) {
      const dayEvents = existingEvents.filter((event) => {
        if (event.date !== date) return false;
        if (event.title.trim().toLowerCase() === 'livre') return false;
        return event.memberId === memberId || event.memberId === 'all';
      });

      // A full-day event makes the whole 07h–22h window unavailable.
      if (dayEvents.some((event) => event.isAllDay)) continue;

      const intervals = dayEvents
        .map((event) => ({
          start: Math.max(dayStart, toMinutes(event.startTime)),
          end: Math.min(dayEnd, toMinutes(event.endTime)),
        }))
        .filter((interval) => interval.end > interval.start && interval.end > dayStart && interval.start < dayEnd)
        .sort((a, b) => a.start - b.start || a.end - b.end);

      const merged: Array<{ start: number; end: number }> = [];
      for (const interval of intervals) {
        const last = merged[merged.length - 1];
        if (!last || interval.start > last.end) {
          merged.push({ ...interval });
        } else {
          last.end = Math.max(last.end, interval.end);
        }
      }

      let cursor = dayStart;
      for (const interval of merged) {
        if (interval.start > cursor) {
          freeEvents.push(makeFreeEvent(memberId, date, toTime(cursor), toTime(interval.start)));
        }
        cursor = Math.max(cursor, interval.end);
      }

      if (cursor < dayEnd) {
        freeEvents.push(makeFreeEvent(memberId, date, toTime(cursor), DAY_END));
      }
    }
  }

  return freeEvents;
}
