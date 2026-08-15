import { CalendarEvent, EventCategory } from '../types';

const ERIKA_ID = 'm_erika';
const SOPHIA_ID = 'm_sophia';
const CREATED_AT = new Date('2026-08-15T12:00:00-03:00').getTime();
const START = '2026-08-17';
const END = '2026-12-18';

type Options = {
  category?: EventCategory;
  location?: string;
  description?: string;
};

function datesByWeekday(start: string, end: string, weekday: number): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);

  while (cursor <= last) {
    if (cursor.getDay() === weekday) {
      dates.push([
        cursor.getFullYear(),
        String(cursor.getMonth() + 1).padStart(2, '0'),
        String(cursor.getDate()).padStart(2, '0'),
      ].join('-'));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function event(
  id: string,
  memberId: string,
  title: string,
  date: string,
  startTime: string,
  endTime: string,
  options: Options = {},
): CalendarEvent {
  return {
    id,
    title,
    memberId,
    date,
    startTime,
    endTime,
    isAllDay: false,
    category: options.category ?? 'other',
    description: options.description,
    location: options.location,
    priority: 'normal',
    reminderMinutes: 0,
    completed: false,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  };
}

function recurring(
  prefix: string,
  memberId: string,
  title: string,
  dates: string[],
  startTime: string,
  endTime: string,
  options: Options = {},
): CalendarEvent[] {
  return dates.map((date) => event(`${prefix}-${date}`, memberId, title, date, startTime, endTime, options));
}

export function getFamilyRoutines2026Events(): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Erika — PSF Colibris II
  [1, 2, 3, 5].forEach((weekday) => {
    events.push(...recurring(
      `erika-psf-${weekday}`,
      ERIKA_ID,
      'Trabalho — PSF Colibris II',
      datesByWeekday(START, END, weekday),
      '07:00',
      '16:00',
      { category: 'work', location: 'PSF Colibris II' },
    ));
  });
  events.push(...recurring(
    'erika-psf-qui',
    ERIKA_ID,
    'Trabalho — PSF Colibris II',
    datesByWeekday(START, END, 4),
    '12:00',
    '16:00',
    { category: 'work', location: 'PSF Colibris II' },
  ));

  // Sophia — Escola, segunda a sexta
  [1, 2, 3, 4, 5].forEach((weekday) => {
    events.push(...recurring(
      `sophia-escola-${weekday}`,
      SOPHIA_ID,
      'Escola — 9º Ano',
      datesByWeekday(START, END, weekday),
      '07:00',
      '12:00',
      { category: 'school', location: 'Escola' },
    ));
  });

  // Sophia — Vôlei, segunda e quarta
  [1, 3].forEach((weekday) => {
    events.push(...recurring(
      `sophia-volei-${weekday}`,
      SOPHIA_ID,
      'Vôlei',
      datesByWeekday(START, END, weekday),
      '17:50',
      '18:50',
      { category: 'sports' },
    ));
  });

  // Sophia — Ballet, quinta e sábado
  events.push(
    ...recurring('sophia-ballet-qui', SOPHIA_ID, 'Ballet', datesByWeekday(START, END, 4), '16:00', '17:30', { category: 'sports' }),
    ...recurring('sophia-ballet-sab', SOPHIA_ID, 'Ballet', datesByWeekday(START, END, 6), '10:00', '12:30', { category: 'sports' }),
  );

  // Sophia — Inglês somente nas sextas-feiras restantes de agosto de 2026
  events.push(...recurring(
    'sophia-ingles-ago',
    SOPHIA_ID,
    'Inglês',
    datesByWeekday('2026-08-17', '2026-08-31', 5),
    '14:00',
    '16:00',
    { category: 'school' },
  ));

  return events;
}
