import { CalendarEvent, FamilyMember } from '../types';
import { PT_DAYS_FULL, PT_MONTHS } from '../utils/dateUtils';

// Web Audio API chime player for instant audio reminders
let audioCtx: AudioContext | null = null;

export function playReminderSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'suspended') {
      audioCtx = new AudioContextClass();
    }

    const now = audioCtx.currentTime;
    
    // Create dual chime harmonic chords
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880.0, now);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.65);
    osc2.stop(now + 0.65);
  } catch (err) {
    console.warn('Audio playback error (user gesture might be needed):', err);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function showBrowserNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    } catch (e) {
      console.warn('Could not show browser notification:', e);
    }
  }
}

/**
 * Generates an .ics (iCalendar) file string to download and import in Apple Calendar, Outlook, Google Calendar, etc.
 */
export function generateIcsFile(events: CalendarEvent[], members: FamilyMember[]): string {
  const memberMap = new Map(members.map(m => [m.id, m.name]));

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Calendario Familiar Sales-Barbosa//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Família Sales-Barbosa',
  ];

  events.forEach(event => {
    const memberName = event.memberId === 'all' ? 'Toda a Família' : (memberMap.get(event.memberId) || 'Família');
    const startStr = event.date.replace(/-/g, '');
    const startTimeStr = (event.startTime || '09:00').replace(':', '') + '00';
    const endTimeStr = (event.endTime || event.startTime || '10:00').replace(':', '') + '00';

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:family-cal-${event.id}@app`);
    ics.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);

    if (event.isAllDay) {
      ics.push(`DTSTART;VALUE=DATE:${startStr}`);
      // next day for exclusive end
      const d = new Date(event.date + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      const nextDayStr = d.toISOString().split('T')[0].replace(/-/g, '');
      ics.push(`DTEND;VALUE=DATE:${nextDayStr}`);
    } else {
      ics.push(`DTSTART:${startStr}T${startTimeStr}`);
      ics.push(`DTEND:${startStr}T${endTimeStr}`);
    }

    ics.push(`SUMMARY:[${memberName}] ${event.title.replace(/[,;]/g, ' ')}`);
    if (event.description) {
      ics.push(`DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`);
    }
    if (event.location) {
      ics.push(`LOCATION:${event.location.replace(/[,;]/g, ' ')}`);
    }

    // Add reminder alarm
    if (event.reminderMinutes > 0) {
      ics.push('BEGIN:VALARM');
      ics.push('ACTION:DISPLAY');
      ics.push(`DESCRIPTION:Lembrete: [${memberName}] ${event.title}`);
      ics.push(`TRIGGER:-PT${event.reminderMinutes}M`);
      ics.push('END:VALARM');
    }

    ics.push('END:VEVENT');
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

/**
 * Formats a clean WhatsApp-ready message of the weekly family schedule.
 */
export function formatWhatsAppSchedule(
  events: CalendarEvent[],
  members: FamilyMember[],
  weekDays: { dateString: string; dayName: string; dayNumber: number; monthName: string; isToday: boolean }[]
): string {
  const memberMap = new Map(members.map(m => [m.id, m]));
  
  let text = `🗓️ *AGENDA SEMANAL - FAMÍLIA SALES-BARBOSA*\n`;
  text += `────────────────────\n\n`;

  let totalEvents = 0;

  weekDays.forEach(day => {
    const dayEvents = events.filter(e => e.date === day.dateString);
    if (dayEvents.length === 0) return;

    totalEvents += dayEvents.length;
    const [year, month, dNum] = day.dateString.split('-').map(Number);
    const dateObj = new Date(year, month - 1, dNum);
    const fullDayName = PT_DAYS_FULL[dateObj.getDay()];

    text += `📌 *${fullDayName}, ${day.dayNumber} de ${day.monthName}* ${day.isToday ? '*(HOJE)*' : ''}\n`;

    // Sort events
    const sorted = [...dayEvents].sort((a, b) => {
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;
      return a.startTime.localeCompare(b.startTime);
    });

    sorted.forEach(ev => {
      const member = ev.memberId === 'all' ? null : memberMap.get(ev.memberId);
      const memberTag = member ? `${member.avatar} ${member.name}` : '👨‍👩‍👧‍👦 Família';
      const timeStr = ev.isAllDay ? '⏰ Dia todo' : `⏰ ${ev.startTime}${ev.endTime ? ` - ${ev.endTime}` : ''}`;
      const locationStr = ev.location ? ` (📍 ${ev.location})` : '';
      const check = ev.completed ? '✅ ' : '▫️ ';

      text += `${check}${timeStr} | *${memberTag}*\n   ↳ ${ev.title}${locationStr}\n`;
      if (ev.description) {
        text += `     _${ev.description}_\n`;
      }
    });

    text += `\n`;
  });

  if (totalEvents === 0) {
    text += `Nenhum compromisso marcado para esta semana! Aproveitem para descansar ou planejar algo especial em família. ✨\n\n`;
  }

  text += `────────────────────\n`;
  text += `_Atualizado em tempo real no Calendário Familiar_ 💚`;

  return text;
}
