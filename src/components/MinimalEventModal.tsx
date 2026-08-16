import React, { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { CalendarEvent, FamilyMember } from '../types';

interface MinimalEventModalProps {
  isOpen: boolean;
  event: CalendarEvent | null;
  profile: FamilyMember;
  defaultDate: string;
  onClose: () => void;
  onSave: (event: CalendarEvent) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
}

export const MinimalEventModal: React.FC<MinimalEventModalProps> = ({
  isOpen,
  event,
  profile,
  defaultDate,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (event) {
      setTitle(event.title);
      setDate(event.date);
      setStartTime(event.startTime || '09:00');
      setEndTime(event.endTime || '10:00');
      setIsAllDay(event.isAllDay || false);
      setLocation(event.location || '');
      setDescription(event.description || '');
    } else {
      setTitle('');
      setDate(defaultDate);
      setStartTime('09:00');
      setEndTime('10:00');
      setIsAllDay(false);
      setLocation('');
      setDescription('');
    }
  }, [isOpen, event, defaultDate]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const now = Date.now();
    const next: CalendarEvent = {
      id: event?.id || `ev-${now}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      memberId: event?.memberId || profile.id,
      date,
      startTime: isAllDay ? '' : startTime,
      endTime: isAllDay ? '' : endTime,
      isAllDay,
      category: event?.category || 'other',
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      priority: event?.priority || 'normal',
      reminderMinutes: event?.reminderMinutes ?? 0,
      googleEventId: event?.googleEventId,
      isSyncedWithGoogle: event?.isSyncedWithGoogle || false,
      completed: event?.completed || false,
      createdAt: event?.createdAt || now,
      updatedAt: now,
    };

    setSaving(true);
    try {
      await onSave(next);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    setSaving(true);
    try {
      await onDelete(event.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/25 flex items-end sm:items-center justify-center sm:p-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            {event ? 'Compromisso' : 'Novo compromisso'}
          </h2>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Título</label>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" required />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" required />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} className="rounded border-slate-300" />
            Dia inteiro
          </label>

          {!isAllDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Início</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Fim</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Local</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Observação</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 resize-none" />
          </div>

          <button type="submit" disabled={saving} className="w-full h-12 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-50">
            {saving ? 'Salvando…' : 'Salvar'}
          </button>

          {event && (
            <button type="button" onClick={handleDelete} disabled={saving} className="w-full h-11 rounded-xl text-rose-600 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              <Trash2 className="w-4 h-4" /> Excluir compromisso
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
