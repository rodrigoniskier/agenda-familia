import React from 'react';
import { CalendarEvent, FamilyMember } from '../types';
import { CATEGORIES } from '../constants';
import { formatTimeRange } from '../utils/dateUtils';
import {
  Clock,
  MapPin,
  Bell,
  CheckCircle2,
  Circle,
  Trash2,
  Cloud,
} from 'lucide-react';

interface EventCardProps {
  event: CalendarEvent;
  members: FamilyMember[];
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  onToggleComplete: (eventId: string) => void;
  compact?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  members,
  onEdit,
  onDelete,
  onToggleComplete,
  compact = false,
}) => {
  const member = event.memberId === 'all'
    ? null
    : members.find(m => m.id === event.memberId);

  const category = CATEGORIES.find(c => c.id === event.category) || CATEGORIES[0];

  const getMemberAccentBar = () => {
    if (!member) return 'bg-indigo-500';
    switch (member.color) {
      case 'rose':
        return 'bg-rose-500';
      case 'blue':
        return 'bg-sky-500';
      case 'emerald':
        return 'bg-emerald-500';
      case 'amber':
        return 'bg-amber-500';
      case 'purple':
        return 'bg-purple-500';
      case 'teal':
        return 'bg-teal-500';
      case 'orange':
        return 'bg-orange-500';
      default:
        return 'bg-indigo-500';
    }
  };

  const getMemberGradient = () => {
    if (!member) return 'from-indigo-500 to-purple-500';
    switch (member.color) {
      case 'rose':
        return 'from-rose-500 to-pink-500';
      case 'blue':
        return 'from-sky-500 to-indigo-500';
      case 'emerald':
        return 'from-emerald-500 to-teal-500';
      case 'amber':
        return 'from-amber-500 to-orange-500';
      case 'purple':
        return 'from-purple-500 to-indigo-500';
      case 'teal':
        return 'from-teal-500 to-emerald-500';
      case 'orange':
        return 'from-orange-500 to-rose-500';
      default:
        return 'from-indigo-500 to-purple-500';
    }
  };

  return (
    <div
      id={`event-card-${event.id}`}
      onClick={() => onEdit(event)}
      className={`group relative rounded-xl border border-slate-200/80 dark:border-[#23232e] bg-white dark:bg-[#16161e] p-3 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-[0_0_15px_rgba(79,70,229,0.15)] hover:border-indigo-500/40 dark:hover:border-indigo-500/40 overflow-hidden ${
        event.completed ? 'opacity-50 saturate-50' : ''
      }`}
    >
      {/* Immersive Left Accent Strip */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${getMemberAccentBar()}`}
      />

      {/* Priority Indicator */}
      {event.priority === 'high' && !event.completed && (
        <span
          className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)] ring-1 ring-white dark:ring-[#070709]"
          title="Alta prioridade"
        />
      )}

      {/* Header: Time + Actions */}
      <div className="flex items-center justify-between gap-1.5 pl-1 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 opacity-70" />
            {formatTimeRange(event.startTime, event.endTime, event.isAllDay)}
          </p>
        </div>

        {/* Action icons */}
        <div
          className="flex items-center gap-0.5 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            id={`toggle-complete-${event.id}`}
            onClick={() => onToggleComplete(event.id)}
            className="p-1 rounded-md text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-[#0d0d12] transition-colors"
            title={event.completed ? 'Marcar como pendente' : 'Marcar como concluído'}
          >
            {event.completed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Circle className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            id={`delete-event-${event.id}`}
            onClick={() => onDelete(event.id)}
            className="p-1 rounded-md text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-[#0d0d12] transition-colors"
            title="Excluir compromisso"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h4
        className={`text-xs font-semibold pl-1 text-slate-900 dark:text-[#f1f1f5] leading-snug line-clamp-2 ${
          event.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
        }`}
      >
        {event.title}
      </h4>

      {/* Description preview */}
      {!compact && event.description && (
        <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-1 mt-1 line-clamp-1">
          {event.description}
        </p>
      )}

      {/* Footer Tags & Member Avatars */}
      <div className="flex items-center justify-between gap-1 mt-2.5 pt-1.5 pl-1 border-t border-slate-100 dark:border-[#23232e]/70 text-[10px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`w-4 h-4 rounded-full bg-gradient-to-tr ${getMemberGradient()} flex items-center justify-center text-[8px] text-white font-bold flex-shrink-0 shadow-xs`}
            title={member ? `${member.name} (${member.role})` : 'Toda a Família'}
          >
            {member ? member.name.charAt(0).toUpperCase() : 'F'}
          </div>
          <span className="truncate max-w-[80px] text-[10px] font-medium text-slate-600 dark:text-slate-300">
            {member ? member.name : 'Família'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {event.reminderMinutes > 0 && (
            <span
              className="text-amber-500 dark:text-amber-400"
              title={`Lembrete ativo (${event.reminderMinutes} min antes)`}
            >
              <Bell className="w-2.5 h-2.5" />
            </span>
          )}

          {event.location && (
            <span className="text-slate-400 truncate max-w-[60px]" title={event.location}>
              <MapPin className="w-2.5 h-2.5 inline mr-0.5" />
            </span>
          )}

          {event.googleEventId && (
            <span
              className="text-blue-500 dark:text-blue-400"
              title="Sincronizado com Google Calendar"
            >
              <Cloud className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

