export type EventCategory =
  | 'school'
  | 'health'
  | 'leisure'
  | 'sports'
  | 'work'
  | 'shopping'
  | 'family'
  | 'other';

export interface CategoryInfo {
  id: EventCategory;
  label: string;
  iconName: string;
  color: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  avatar: string; // Emoji or short text
  color: string; // Tailwind color theme identifier or hex
  badgeBg: string;
  textColor: string;
  borderColor: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  memberId: string; // 'all' or FamilyMember.id
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAllDay: boolean;
  category: EventCategory;
  description?: string;
  location?: string;
  priority: 'low' | 'normal' | 'high';
  reminderMinutes: number; // 0, 15, 30, 60, 120, 1440
  googleEventId?: string;
  isSyncedWithGoogle?: boolean;
  completed?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WeekDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayName: string;
  dayNumber: number;
  monthName: string;
  isToday: boolean;
  isPast: boolean;
}

export type ViewMode = 'week' | 'day' | 'list';

export type ThemeMode = 'light' | 'dark';
