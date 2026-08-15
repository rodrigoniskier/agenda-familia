import { CalendarEvent, EventCategory } from '../types';

const RODRIGO_ID = 'm_rodrigo';
const CREATED_AT = new Date('2026-08-15T12:00:00-03:00').getTime();

type EventOptions = {
  category?: EventCategory;
  description?: string;
  location?: string;
  isAllDay?: boolean;
  priority?: CalendarEvent['priority'];
  reminderMinutes?: number;
};

function makeEvent(
  id: string,
  title: string,
  date: string,
  startTime: string,
  endTime: string,
  options: EventOptions = {},
): CalendarEvent {
  return {
    id,
    title,
    memberId: RODRIGO_ID,
    date,
    startTime,
    endTime,
    isAllDay: options.isAllDay ?? false,
    category: options.category ?? 'school',
    description: options.description,
    location: options.location,
    priority: options.priority ?? 'normal',
    reminderMinutes: options.reminderMinutes ?? 0,
    completed: false,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  };
}

function datesByWeekday(start: string, end: string, weekday: number, excluded: string[] = []): string[] {
  const excludedSet = new Set(excluded);
  const dates: string[] = [];
  const cursor = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);

  while (cursor <= last) {
    if (cursor.getDay() === weekday) {
      const date = [
        cursor.getFullYear(),
        String(cursor.getMonth() + 1).padStart(2, '0'),
        String(cursor.getDate()).padStart(2, '0'),
      ].join('-');
      if (!excludedSet.has(date)) dates.push(date);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function recurring(
  idPrefix: string,
  title: string,
  dates: string[],
  startTime: string,
  endTime: string,
  options: EventOptions = {},
): CalendarEvent[] {
  return dates.map((date) => makeEvent(`${idPrefix}-${date}`, title, date, startTime, endTime, options));
}

function allDay(
  id: string,
  title: string,
  date: string,
  description?: string,
): CalendarEvent {
  return makeEvent(id, title, date, '00:00', '23:59', {
    category: 'other',
    description,
    location: 'Igreja Presbiteriana do Altiplano',
    isAllDay: true,
  });
}

export function getSemester2026Events(): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // UNIPÊ — MAPD-2, Turmas A e B (segundas-feiras)
  const mapdMondayDates = datesByWeekday('2026-08-03', '2026-11-30', 1, [
    '2026-09-07',
    '2026-10-12',
    '2026-11-02',
  ]);
  events.push(
    ...recurring('unipe-mapd-b', 'UNIPÊ — MAPD-2 — Turma B', mapdMondayDates, '13:00', '15:30', {
      category: 'work',
      location: 'UNIPÊ',
      description: 'Mecanismos de Agressão, Patológicos e de Defesa II — Turma B.',
    }),
    ...recurring('unipe-mapd-a', 'UNIPÊ — MAPD-2 — Turma A', mapdMondayDates, '15:30', '18:00', {
      category: 'work',
      location: 'UNIPÊ',
      description: 'Mecanismos de Agressão, Patológicos e de Defesa II — Turma A.',
    }),
  );

  // UNIPÊ — MAPD-2, Turma C (quintas-feiras)
  const mapdThursdayDates = datesByWeekday('2026-08-06', '2026-12-10', 4, [
    '2026-10-08', // semana de resgate — sem atividade docente definida
    '2026-10-15', // Dia do Professor
  ]);
  events.push(
    ...recurring('unipe-mapd-c', 'UNIPÊ — MAPD-2 — Turma C', mapdThursdayDates, '15:30', '18:00', {
      category: 'work',
      location: 'UNIPÊ',
      description: 'Mecanismos de Agressão, Patológicos e de Defesa II — Turma C.',
    }),
  );

  // UNIPÊ — Inovação em Saúde, Turma A (quartas-feiras)
  events.push(
    ...recurring(
      'unipe-inov-a',
      'UNIPÊ — Inovação em Saúde — Turma A',
      datesByWeekday('2026-08-12', '2026-12-16', 3),
      '18:00',
      '19:40',
      {
        category: 'work',
        location: 'UNIPÊ',
      },
    ),
  );

  // UNIPÊ — Inovação em Saúde, Turmas C/D (quintas-feiras)
  events.push(
    ...recurring(
      'unipe-inov-cd',
      'UNIPÊ — Inovação em Saúde — Turmas C/D',
      datesByWeekday('2026-08-13', '2026-12-17', 4, ['2026-10-15']),
      '18:00',
      '19:40',
      {
        category: 'work',
        location: 'UNIPÊ',
      },
    ),
  );

  // UNIPÊ — Inovação em Saúde, Turma B (sextas-feiras)
  events.push(
    ...recurring(
      'unipe-inov-b',
      'UNIPÊ — Inovação em Saúde — Turma B',
      datesByWeekday('2026-08-14', '2026-12-18', 5, ['2026-11-20']),
      '15:30',
      '17:10',
      {
        category: 'work',
        location: 'UNIPÊ',
      },
    ),
  );

  // Prova integrada institucional, comum aos componentes
  events.push(
    makeEvent('unipe-prova-integrada-2026-11-28', 'UNIPÊ — Prova Integrada (P2–P8)', '2026-11-28', '08:00', '12:00', {
      category: 'work',
      location: 'UNIPÊ',
      priority: 'high',
    }),
  );

  // Seminário Presbiteriano do Norte — T3. Período regular: 17/08 a 27/11/2026.
  const mon = datesByWeekday('2026-08-17', '2026-11-27', 1);
  const tue = datesByWeekday('2026-08-17', '2026-11-27', 2);
  const wed = datesByWeekday('2026-08-17', '2026-11-27', 3);
  const thu = datesByWeekday('2026-08-17', '2026-11-27', 4);
  const fri = datesByWeekday('2026-08-17', '2026-11-27', 5);

  events.push(
    ...recurring('spn-seg-culto', 'Seminário — Teologia do Culto 1', mon, '10:00', '11:30', {
      location: 'Online',
      description: 'Turma T3 — aula de segunda-feira on-line.',
    }),
    ...recurring('spn-seg-exegese-nt', 'Seminário — Exegese do NT 2', mon, '11:30', '13:00', {
      location: 'Online',
      description: 'Turma T3 — aula de segunda-feira on-line.',
    }),
    ...recurring('spn-ter-monografia', 'Seminário — Monografia 1', tue, '07:30', '09:00', {
      location: 'Seminário Presbiteriano do Norte — Recife',
    }),
    ...recurring('spn-ter-pregacao', 'Seminário — Pregação 4', tue, '10:00', '11:30', {
      location: 'Seminário Presbiteriano do Norte — Recife',
    }),
    ...recurring('spn-ter-historia4', 'Seminário — História da Igreja 4', tue, '11:30', '13:00', {
      location: 'Seminário Presbiteriano do Norte — Recife',
    }),
    ...recurring('spn-qua-ts5', 'Seminário — Teologia Sistemática 5', wed, '07:30', '09:00', {
      location: 'Seminário Presbiteriano do Norte — Recife',
    }),
    ...recurring('spn-qua-apologetica', 'Seminário — Apologética', wed, '10:00', '11:30', {
      location: 'Seminário Presbiteriano do Norte — Recife',
    }),
    ...recurring('spn-qua-historia4', 'Seminário — História da Igreja 4', wed, '11:30', '13:00', {
      location: 'Seminário Presbiteriano do Norte — Recife',
    }),
    ...recurring('spn-qui-exegese-at', 'Seminário — Exegese do AT 2', thu, '07:30', '09:00', {
      location: 'Seminário Presbiteriano do Norte — Recife',
    }),
    ...recurring('spn-qui-hpc2', 'Seminário — História do Pensamento Cristão 2', thu, '10:00', '11:30', {
      location: 'Seminário Presbiteriano do Norte — Recife',
    }),
    ...recurring('spn-qui-didatica', 'Seminário — Didática', thu, '11:30', '13:00', {
      location: 'Seminário Presbiteriano do Norte — Recife',
    }),
    ...recurring('spn-sex-plantacao1', 'Seminário — Plantação e Revitalização de Igrejas', fri, '07:30', '09:00', {
      location: 'Seminário Presbiteriano do Norte — Recife',
    }),
    ...recurring('spn-sex-plantacao2', 'Seminário — Plantação e Revitalização de Igrejas', fri, '10:00', '11:30', {
      location: 'Seminário Presbiteriano do Norte — Recife',
    }),
  );

  // EBD — Terceira Idade
  events.push(
    allDay('ebd-terceira-2026-08-23', 'EBD — Terceira Idade', '2026-08-23', 'Um legado de fé para a próxima geração — Salmo 71:17-18.'),
    allDay('ebd-terceira-2026-09-20', 'EBD — Terceira Idade', '2026-09-20', 'O que darei ao Senhor? A resposta do serviço — Salmo 116:1-14.'),
    allDay('ebd-terceira-2026-10-18', 'EBD — Terceira Idade', '2026-10-18', 'Semeando a Palavra: trabalho contínuo e recompensa — Salmo 126:1-6.'),
    allDay('ebd-terceira-2026-11-15', 'EBD — Terceira Idade', '2026-11-15', 'O ministério noturno: fidelidade em todo tempo — Salmo 134:1-3.'),
    allDay('ebd-terceira-2026-12-13', 'EBD — Terceira Idade', '2026-12-13', 'O desejo de habitar e servir ao Senhor para sempre — Salmo 27:4-6.'),
  );

  // EBD — Adolescentes
  ['2026-09-06', '2026-10-04', '2026-11-01', '2026-11-29'].forEach((date) => {
    events.push(allDay(`ebd-adolescentes-${date}`, 'EBD — Adolescentes', date, 'Escala de ensino — Presb. Rodrigo.'));
  });

  // EBD — Homens e Mulheres
  events.push(
    allDay('ebd-hm-2026-08-23', 'EBD — Homens e Mulheres', '2026-08-23', 'O serviço que transforma ambientes — João 2:1-12.'),
    allDay('ebd-hm-2026-09-13', 'EBD — Homens e Mulheres', '2026-09-13', 'Fé obediente em meio às necessidades — João 4:43-54.'),
    allDay('ebd-hm-2026-10-04', 'EBD — Homens e Mulheres', '2026-10-04', 'Permanecer em Cristo para servir com fidelidade — João 6:22-71.'),
    allDay('ebd-hm-2026-10-25', 'EBD — Homens e Mulheres', '2026-10-25', 'Serviço que abre os olhos para Cristo — João 9:1-41.'),
    allDay('ebd-hm-2026-11-15', 'EBD — Homens e Mulheres', '2026-11-15', 'Adoração que se entrega totalmente — João 12:1-26.'),
    allDay('ebd-hm-2026-12-06', 'EBD — Homens e Mulheres', '2026-12-06', 'Servindo fortalecidos pelo Espírito Santo — João 16:5-15.'),
  );

  return events;
}
