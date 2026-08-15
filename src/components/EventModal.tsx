import React, { useState, useEffect } from 'react';
import { CalendarEvent, FamilyMember, EventCategory } from '../types';
import { CATEGORIES, REMINDER_OPTIONS } from '../constants';
import {
  X,
  Clock,
  MapPin,
  FileText,
  Bell,
  Calendar,
  AlertCircle,
  Trash2,
  Copy,
  Check,
  Cloud
} from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent, syncWithGoogle: boolean) => void;
  onDelete?: (eventId: string) => void;
  eventToEdit: CalendarEvent | null;
  defaultDate?: string;
  members: FamilyMember[];
  isGoogleConnected: boolean;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  eventToEdit,
  defaultDate,
  members,
  isGoogleConnected,
}) => {
  const [title, setTitle] = useState('');
  const [memberId, setMemberId] = useState<string>('all');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [category, setCategory] = useState<EventCategory>('family');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [syncWithGoogle, setSyncWithGoogle] = useState(isGoogleConnected);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setMemberId(eventToEdit.memberId);
      setDate(eventToEdit.date);
      setStartTime(eventToEdit.startTime || '09:00');
      setEndTime(eventToEdit.endTime || '10:00');
      setIsAllDay(eventToEdit.isAllDay || false);
      setCategory(eventToEdit.category || 'family');
      setLocation(eventToEdit.location || '');
      setDescription(eventToEdit.description || '');
      setPriority(eventToEdit.priority || 'normal');
      setReminderMinutes(eventToEdit.reminderMinutes ?? 30);
      setSyncWithGoogle(isGoogleConnected && !!eventToEdit.googleEventId);
    } else {
      setTitle('');
      setMemberId(members[0]?.id || 'all');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndTime('10:00');
      setIsAllDay(false);
      setCategory('family');
      setLocation('');
      setDescription('');
      setPriority('normal');
      setReminderMinutes(30);
      setSyncWithGoogle(isGoogleConnected);
    }
    setError(null);
  }, [eventToEdit, defaultDate, isOpen, isGoogleConnected, members]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor, informe o título do compromisso.');
      return;
    }
    if (!date) {
      setError('Por favor, informe a data.');
      return;
    }

    const now = Date.now();
    const eventData: CalendarEvent = {
      id: eventToEdit ? eventToEdit.id : `ev-${now}-${Math.random().toString(36).substr(2, 5)}`,
      title: title.trim(),
      memberId,
      date,
      startTime: isAllDay ? '' : startTime,
      endTime: isAllDay ? '' : endTime,
      isAllDay,
      category,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      priority,
      reminderMinutes,
      googleEventId: eventToEdit?.googleEventId,
      isSyncedWithGoogle: syncWithGoogle,
      completed: eventToEdit?.completed || false,
      createdAt: eventToEdit?.createdAt || now,
      updatedAt: now,
    };

    onSave(eventData, syncWithGoogle);
    onClose();
  };

  const handleDuplicate = () => {
    if (!eventToEdit) return;
    const now = Date.now();
    const duplicated: CalendarEvent = {
      ...eventToEdit,
      id: `ev-${now}-${Math.random().toString(36).substr(2, 5)}`,
      title: `${eventToEdit.title} (Cópia)`,
      googleEventId: undefined,
      isSyncedWithGoogle: false,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    onSave(duplicated, false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div
        id="event-modal-container"
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-[#1f1f27] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-[#1f1f27] bg-slate-50/50 dark:bg-[#16161e]/50">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {eventToEdit ? 'Editar Compromisso' : 'Novo Compromisso Familiar'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16161e] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Título do compromisso *
            </label>
            <input
              type="text"
              id="event-title-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Natação do Lucas, Consulta Pediatra, Jantar de Família..."
              autoFocus
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>

          {/* Family Member Assignment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Membro da família responsável
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setMemberId('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  memberId === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.3)]'
                    : 'bg-slate-50 dark:bg-[#16161e] border-slate-200 dark:border-[#23232e] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1f1f27]'
                }`}
              >
                <span>👨‍👩‍👧‍👦</span>
                <span>Toda a Família</span>
              </button>

              {members.map(member => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setMemberId(member.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    memberId === member.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.3)]'
                      : 'bg-slate-50 dark:bg-[#16161e] border-slate-200 dark:border-[#23232e] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1f1f27]'
                  }`}
                >
                  <span>{member.avatar}</span>
                  <span>{member.name}</span>
                  <span className="text-[10px] opacity-70">({member.role})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Data *
              </label>
              <input
                type="date"
                id="event-date-input"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>

            {!isAllDay && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Início
                  </label>
                  <input
                    type="time"
                    id="event-start-time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Término
                  </label>
                  <input
                    type="time"
                    id="event-end-time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
              </>
            )}
          </div>

          {/* All Day Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="event-all-day-checkbox"
              checked={isAllDay}
              onChange={e => setIsAllDay(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
            />
            <label htmlFor="event-all-day-checkbox" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              Compromisso de dia inteiro
            </label>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Categoria
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    category === cat.id
                      ? 'bg-indigo-600/15 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-[#16161e] border-slate-200 dark:border-[#23232e] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1f1f27]'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Automatic Reminder & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  Lembrete automático
                </span>
              </label>
              <select
                id="event-reminder-select"
                value={reminderMinutes}
                onChange={e => setReminderMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              >
                {REMINDER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Prioridade
              </label>
              <select
                id="event-priority-select"
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              >
                <option value="low">Baixa</option>
                <option value="normal">Normal</option>
                <option value="high">Alta Prioridade 🚨</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Local / Endereço / Link
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="event-location-input"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Ex: Colégio São Bento, Hospital Infantil, Zoom..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Anotações / Instruções
            </label>
            <textarea
              id="event-description-input"
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Levar documento de identidade, levar lanche extra, papai busca..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"
            />
          </div>

          {/* Google Calendar Sync Toggle */}
          {isGoogleConnected && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    Sincronizar com Google Calendar
                  </p>
                  <p className="text-[11px] text-blue-700/80 dark:text-blue-400">
                    Cria e atualiza este evento na sua conta Google conectada.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                id="sync-google-toggle"
                checked={syncWithGoogle}
                onChange={e => setSyncWithGoogle(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-md border-blue-300 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Action Buttons in Modal */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-[#1f1f27] gap-2">
            <div className="flex items-center gap-1.5">
              {eventToEdit && onDelete && (
                <button
                  type="button"
                  id="btn-delete-modal"
                  onClick={() => {
                    onDelete(eventToEdit.id);
                    onClose();
                  }}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 transition-colors cursor-pointer"
                  title="Excluir evento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {eventToEdit && (
                <button
                  type="button"
                  id="btn-duplicate-modal"
                  onClick={handleDuplicate}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16161e] border border-slate-200 dark:border-[#23232e] transition-colors cursor-pointer"
                  title="Duplicar evento"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16161e] rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-save-event"
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-[0_0_12px_rgba(79,70,229,0.4)] transition-all cursor-pointer"
              >
                {eventToEdit ? 'Atualizar Evento' : 'Salvar Compromisso'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
