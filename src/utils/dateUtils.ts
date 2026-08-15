import { WeekDay, CalendarEvent } from '../types';

export const PT_DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const PT_DAYS_FULL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
export const PT_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
export const PT_MONTHS_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export function formatDateToISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Returns the 7 days of the week starting from Monday (or Sunday) for a given date.
 */
export function getWeekDates(referenceDate: Date, startOnMonday = true): WeekDay[] {
  const current = new Date(referenceDate);
  const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, ...
  
  // Calculate difference to start of week
  let diffToStart: number;
  if (startOnMonday) {
    diffToStart = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  } else {
    diffToStart = -dayOfWeek;
  }

  const startOfWeek = new Date(current);
  startOfWeek.setDate(current.getDate() + diffToStart);
  startOfWeek.setHours(0, 0, 0, 0);

  const todayStr = formatDateToISO(new Date());
  const weekDays: WeekDay[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateString = formatDateToISO(d);
    const dayIndex = d.getDay();

    weekDays.push({
      date: d,
      dateString,
      dayName: PT_DAYS_SHORT[dayIndex],
      dayNumber: d.getDate(),
      monthName: PT_MONTHS_SHORT[d.getMonth()],
      isToday: dateString === todayStr,
      isPast: dateString < todayStr,
    });
  }

  return weekDays;
}

export function getWeekLabel(weekDays: WeekDay[]): string {
  if (weekDays.length === 0) return '';
  const first = weekDays[0];
  const last = weekDays[weekDays.length - 1];

  if (first.date.getMonth() === last.date.getMonth()) {
    return `${first.dayNumber} a ${last.dayNumber} de ${PT_MONTHS[first.date.getMonth()]} de ${first.date.getFullYear()}`;
  } else if (first.date.getFullYear() === last.date.getFullYear()) {
    return `${first.dayNumber} de ${PT_MONTHS_SHORT[first.date.getMonth()]} - ${last.dayNumber} de ${PT_MONTHS_SHORT[last.date.getMonth()]} de ${first.date.getFullYear()}`;
  } else {
    return `${first.dayNumber} de ${PT_MONTHS_SHORT[first.date.getMonth()]} ${first.date.getFullYear()} - ${last.dayNumber} de ${PT_MONTHS_SHORT[last.date.getMonth()]} ${last.date.getFullYear()}`;
  }
}

export function formatTimeRange(startTime: string, endTime: string, isAllDay: boolean): string {
  if (isAllDay) return 'Dia inteiro';
  if (!startTime) return '';
  if (!endTime || endTime === startTime) return startTime;
  return `${startTime} - ${endTime}`;
}

export function isTimeValid(timeStr: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr);
}

export function sortEventsByTime(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    if (a.isAllDay && !b.isAllDay) return -1;
    if (!a.isAllDay && b.isAllDay) return 1;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });
}
