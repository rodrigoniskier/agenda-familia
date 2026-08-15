import { CalendarEvent, FamilyMember, ThemeMode } from '../types';
import { INITIAL_MEMBERS } from '../constants';
import { getSemester2026Events } from '../data/semester2026';
import { getFamilyRoutines2026Events } from '../data/familyRoutines2026';

const STORAGE_KEYS = {
  EVENTS: 'family_cal_events_v4',
  MEMBERS: 'family_cal_members_v4',
  THEME: 'family_cal_theme_v2',
  NOTIFICATIONS_ENABLED: 'family_cal_notif_v2',
  GOOGLE_SYNC_TIME: 'family_cal_last_google_sync',
  SEMESTER_2026_2_MIGRATION: 'family_cal_semester_2026_2_v2',
};

// Generate initial family events (empty by default for real user data)
export function generateSeedEvents(_members: FamilyMember[]): CalendarEvent[] {
  return [];
}

function eventSignature(event: CalendarEvent): string {
  return [event.title, event.date, event.startTime, event.endTime, event.memberId].join('|');
}

function mergeSemester2026Events(existingEvents: CalendarEvent[]): CalendarEvent[] {
  try {
    const alreadyImported = localStorage.getItem(STORAGE_KEYS.SEMESTER_2026_2_MIGRATION) === 'done';
    if (alreadyImported) return existingEvents;

    const semesterEvents = [
      ...getSemester2026Events(),
      ...getFamilyRoutines2026Events(),
    ];
    const existingIds = new Set(existingEvents.map((event) => event.id));
    const existingSignatures = new Set(existingEvents.map(eventSignature));

    const eventsToAdd = semesterEvents.filter(
      (event) => !existingIds.has(event.id) && !existingSignatures.has(eventSignature(event)),
    );

    const merged = [...existingEvents, ...eventsToAdd];
    saveStoredEvents(merged);
    localStorage.setItem(STORAGE_KEYS.SEMESTER_2026_2_MIGRATION, 'done');
    return merged;
  } catch (e) {
    console.warn('Error importing semester 2026.2 events:', e);
    return existingEvents;
  }
}

export function loadStoredMembers(): FamilyMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error loading members from storage:', e);
  }
  return INITIAL_MEMBERS;
}

export function saveStoredMembers(members: FamilyMember[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  } catch (e) {
    console.error('Error saving members:', e);
  }
}

export function loadStoredEvents(members: FamilyMember[]): CalendarEvent[] {
  let existingEvents: CalendarEvent[] = [];

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        existingEvents = parsed;
      }
    } else {
      existingEvents = generateSeedEvents(members);
    }
  } catch (e) {
    console.warn('Error loading events from storage:', e);
    existingEvents = generateSeedEvents(members);
  }

  return mergeSemester2026Events(existingEvents);
}

export function saveStoredEvents(events: CalendarEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  } catch (e) {
    console.error('Error saving events:', e);
  }
}

export function loadStoredTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    if (raw === 'dark' || raw === 'light') return raw;
  } catch (e) {
    console.warn('Error loading theme:', e);
  }
  // Check system preference
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function saveStoredTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (e) {}
}

export function loadNotificationsEnabled(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
    return raw ? JSON.parse(raw) : true;
  } catch (e) {
    return true;
  }
}

export function saveNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, JSON.stringify(enabled));
  } catch (e) {}
}

export function loadLastGoogleSyncTime(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.GOOGLE_SYNC_TIME);
  } catch (e) {
    return null;
  }
}

export function saveLastGoogleSyncTime(timeIso: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_SYNC_TIME, timeIso);
  } catch (e) {}
}
