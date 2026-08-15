import React, { useState, useEffect } from 'react';
import { CalendarEvent, FamilyMember } from '../types';
import { formatDateToISO } from '../utils/dateUtils';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Clock,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import {
  playReminderSound,
  requestNotificationPermission,
  showBrowserNotification,
} from '../services/notificationService';

interface UpcomingRemindersBarProps {
  events: CalendarEvent[];
  members: FamilyMember[];
  onSelectEvent: (event: CalendarEvent) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: (enabled: boolean) => void;
}

export const UpcomingRemindersBar: React.FC<UpcomingRemindersBarProps> = ({
  events,
  members,
  onSelectEvent,
  notificationsEnabled,
  onToggleNotifications,
}) => {
  const [notifPermission, setNotifPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [audioFeedback, setAudioFeedback] = useState(false);
  const [notifiedEventIds, setNotifiedEventIds] = useState<Set<string>>(new Set());

  const todayStr = formatDateToISO(new Date());

  // Find today's events sorted by time
  const todayEvents = events
    .filter(e => e.date === todayStr && !e.completed)
    .sort((a, b) => {
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;
      return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
    });

  // Calculate current minutes from midnight
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Find the next upcoming event
  const upcomingEvent = todayEvents.find(e => {
    if (e.isAllDay) return false;
    const [h, m] = (e.startTime || '00:00').split(':').map(Number);
    const eventMinutes = h * 60 + m;
    return eventMinutes >= currentMinutes;
  });

  // Auto-reminder check loop every 30s
  useEffect(() => {
    const checkReminders = () => {
      if (!notificationsEnabled) return;

      const currentDate = new Date();
      const currentIso = formatDateToISO(currentDate);
      const currMin = currentDate.getHours() * 60 + currentDate.getMinutes();

      events.forEach(event => {
        if (event.completed || event.date !== currentIso || event.isAllDay) return;
        if (!event.startTime) return;

        const [eh, em] = event.startTime.split(':').map(Number);
        const eventStartMin = eh * 60 + em;
        const reminderOffset = event.reminderMinutes || 15; // default 15m if reminder set
        const triggerMin = eventStartMin - reminderOffset;

        // If we are within 2 minutes of the reminder trigger time and haven't notified yet
        const reminderKey = `${event.id}_${currentIso}_${triggerMin}`;
        if (currMin >= triggerMin && currMin <= eventStartMin && !notifiedEventIds.has(reminderKey)) {
          // Play subtle chime
          playReminderSound();

          // Get member name
          const member = members.find(m => m.id === event.memberId);
          const memberName = member ? member.name : 'Família';

          // Show browser notification
          showBrowserNotification(
            `🔔 Lembrete: ${event.title}`,
            `[${memberName}] às ${event.startTime}${event.location ? ` em ${event.location}` : ''}`
          );

          setNotifiedEventIds(prev => new Set(prev).add(reminderKey));
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [events, members, notificationsEnabled, notifiedEventIds]);

  const handleEnableBrowserNotifs = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
    if (granted) {
      playReminderSound();
      setAudioFeedback(true);
      setTimeout(() => setAudioFeedback(false), 2000);
    }
  };

  const getMinutesUntil = (startTime: string) => {
    const [h, m] = startTime.split(':').map(Number);
    const diff = h * 60 + m - currentMinutes;
    if (diff <= 0) return 'Agora';
    if (diff < 60) return `em ${diff} min`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `em ${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  };

  if (todayEvents.length === 0) {
    return (
      <div
        id="upcoming-reminders-bar"
        className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-[#0d0d12]/80 border border-slate-200 dark:border-[#1f1f27] text-xs text-slate-600 dark:text-slate-400 shadow-xs"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </span>
          <span className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
            Dia Livre
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            Nenhum compromisso pendente para hoje.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleNotifications(!notificationsEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              notificationsEnabled
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-[#16161e] border border-emerald-300 dark:border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e]'
            }`}
            title="Lembretes automáticos ativos"
          >
            {notificationsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{notificationsEnabled ? 'Lembretes ativos' : 'Silenciado'}</span>
          </button>
        </div>
      </div>
    );
  }

  const nextMember = upcomingEvent ? members.find(m => m.id === upcomingEvent.memberId) : null;

  return (
    <div
      id="upcoming-reminders-bar"
      className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-[#0d0d12]/90 border border-slate-200 dark:border-[#1f1f27] text-xs shadow-xs"
    >
      {/* Next event prompt */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-indigo-600 text-white flex-shrink-0 shadow-[0_0_10px_rgba(79,70,229,0.4)]">
          <BellRing className="w-3.5 h-3.5 animate-pulse" />
        </div>

        {upcomingEvent ? (
          <div
            onClick={() => onSelectEvent(upcomingEvent)}
            className="flex items-center gap-2 cursor-pointer truncate group"
          >
            <span className="font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap text-[11px] uppercase tracking-wider">
              Próximo ({getMinutesUntil(upcomingEvent.startTime)}):
            </span>
            <span className="text-slate-900 dark:text-white font-semibold truncate group-hover:underline">
              {upcomingEvent.title}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[#16161e] text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-[#23232e] flex-shrink-0">
              {nextMember ? `${nextMember.avatar} ${nextMember.name}` : '👨‍👩‍👧‍👦 Família'} • {upcomingEvent.startTime}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-[11px] uppercase tracking-wider">
              Agenda de hoje:
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              {todayEvents.length} {todayEvents.length === 1 ? 'compromisso restante' : 'compromissos restantes'}.
            </span>
          </div>
        )}
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {notifPermission !== 'granted' && (
          <button
            type="button"
            id="btn-request-browser-notif"
            onClick={handleEnableBrowserNotifs}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-[#16161e] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#23232e] hover:bg-slate-50 dark:hover:bg-[#1f1f27] transition-all cursor-pointer"
          >
            <Bell className="w-3 h-3 text-indigo-500" />
            <span>Alertas no navegador</span>
          </button>
        )}

        <button
          type="button"
          id="btn-toggle-notif-sound"
          onClick={() => {
            onToggleNotifications(!notificationsEnabled);
            if (!notificationsEnabled) playReminderSound();
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            notificationsEnabled
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-[#16161e] border border-indigo-200 dark:border-indigo-500/30 shadow-[0_0_10px_rgba(79,70,229,0.15)]'
              : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e]'
          }`}
          title="Alternar som dos lembretes automáticos"
        >
          {notificationsEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Som ligado</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>Mudo</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
