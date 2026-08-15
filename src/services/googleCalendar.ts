import { CalendarEvent, FamilyMember } from '../types';

export interface GoogleCalendarApiEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
  status?: string;
}

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  timeMinISO: string,
  timeMaxISO: string
): Promise<GoogleCalendarApiEvent[]> {
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.append('timeMin', timeMinISO);
  url.searchParams.append('timeMax', timeMaxISO);
  url.searchParams.append('singleEvents', 'true');
  url.searchParams.append('orderBy', 'startTime');
  url.searchParams.append('maxResults', '100');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao buscar eventos do Google Calendar: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.items || [];
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  event: CalendarEvent,
  memberName: string
): Promise<string> {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

  const memberTag = memberName ? `[${memberName}] ` : '[Família] ';
  const summary = `${memberTag}${event.title}`;

  let body: any = {
    summary,
    description: event.description ? `${event.description}\n\nResponsável: ${memberName}` : `Responsável: ${memberName}`,
    location: event.location || undefined,
  };

  if (event.isAllDay) {
    body.start = { date: event.date };
    // End date for all-day event is exclusive, so next day
    const nextDay = new Date(event.date + 'T00:00:00');
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];
    body.end = { date: nextDayStr };
  } else {
    // Format full ISO strings with local timezone offset
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const startDateTime = `${event.date}T${event.startTime || '09:00'}:00`;
    const endDateTime = `${event.date}T${event.endTime || event.startTime || '10:00'}:00`;

    body.start = { dateTime: new Date(startDateTime).toISOString(), timeZone };
    body.end = { dateTime: new Date(endDateTime).toISOString(), timeZone };
  }

  if (event.reminderMinutes > 0) {
    body.reminders = {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: event.reminderMinutes }],
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao criar evento no Google Calendar: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.id;
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  googleEventId: string,
  event: CalendarEvent,
  memberName: string
): Promise<void> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`;

  const memberTag = memberName ? `[${memberName}] ` : '[Família] ';
  const summary = `${memberTag}${event.title}`;

  let body: any = {
    summary,
    description: event.description ? `${event.description}\n\nResponsável: ${memberName}` : `Responsável: ${memberName}`,
    location: event.location || undefined,
  };

  if (event.isAllDay) {
    body.start = { date: event.date };
    const nextDay = new Date(event.date + 'T00:00:00');
    nextDay.setDate(nextDay.getDate() + 1);
    body.end = { date: nextDay.toISOString().split('T')[0] };
  } else {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const startDateTime = `${event.date}T${event.startTime || '09:00'}:00`;
    const endDateTime = `${event.date}T${event.endTime || event.startTime || '10:00'}:00`;

    body.start = { dateTime: new Date(startDateTime).toISOString(), timeZone };
    body.end = { dateTime: new Date(endDateTime).toISOString(), timeZone };
  }

  if (event.reminderMinutes > 0) {
    body.reminders = {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: event.reminderMinutes }],
    };
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao atualizar no Google Calendar: ${response.status} ${errorText}`);
  }
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  googleEventId: string
): Promise<void> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404 && response.status !== 410) {
    const errorText = await response.text();
    throw new Error(`Erro ao remover do Google Calendar: ${response.status} ${errorText}`);
  }
}
