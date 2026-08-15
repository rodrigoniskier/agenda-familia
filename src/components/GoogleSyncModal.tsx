import React, { useState } from 'react';
import { CalendarEvent, FamilyMember, WeekDay } from '../types';
import { User } from 'firebase/auth';
import { googleSignIn, logout } from '../services/auth';
import {
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from '../services/googleCalendar';
import {
  X,
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarCheck,
  LogOut,
  ExternalLink
} from 'lucide-react';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  accessToken: string | null;
  onAuthSuccess: (user: User, token: string) => void;
  onLogout: () => void;
  events: CalendarEvent[];
  members: FamilyMember[];
  weekDays: WeekDay[];
  onImportEvents: (newEvents: CalendarEvent[]) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  lastSyncTime: string | null;
  onSetLastSyncTime: (timeIso: string) => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  user,
  accessToken,
  onAuthSuccess,
  onLogout,
  events,
  members,
  weekDays,
  onImportEvents,
  onUpdateEvent,
  lastSyncTime,
  onSetLastSyncTime,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthSuccess(result.user, result.accessToken);
        setStatusMessage(`Conectado como ${result.user.displayName || result.user.email}!`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao conectar com o Google Calendar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    onLogout();
    setStatusMessage('Desconectado do Google Calendar.');
  };

  // Push all weekly family events to Google Calendar
  const handlePushToGoogle = async () => {
    if (!accessToken) {
      setErrorMessage('Conecte sua conta Google primeiro.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('Sincronizando eventos familiares com o Google Calendar...');

    try {
      const memberMap = new Map<string, string>(members.map(m => [m.id, m.name]));
      let syncedCount = 0;

      for (const event of events) {
        const memberName: string = event.memberId === 'all' ? 'Toda a Família' : (memberMap.get(event.memberId) || 'Família');
        
        if (event.googleEventId) {
          // Update existing
          await updateGoogleCalendarEvent(accessToken, event.googleEventId, event, memberName);
          syncedCount++;
        } else {
          // Create new
          const gId = await createGoogleCalendarEvent(accessToken, event, memberName);
          onUpdateEvent({ ...event, googleEventId: gId, isSyncedWithGoogle: true });
          syncedCount++;
        }
      }

      const nowIso = new Date().toISOString();
      onSetLastSyncTime(nowIso);
      setStatusMessage(`${syncedCount} compromisso(s) exportado(s) com sucesso para o Google Calendar!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao sincronizar com o Google Calendar.');
    } finally {
      setIsLoading(false);
    }
  };

  // Pull events from Google Calendar for the selected week
  const handlePullFromGoogle = async () => {
    if (!accessToken) {
      setErrorMessage('Conecte sua conta Google primeiro.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('Buscando eventos da sua agenda Google...');

    try {
      const firstDay = weekDays[0]?.dateString || new Date().toISOString().split('T')[0];
      const lastDay = weekDays[6]?.dateString || new Date().toISOString().split('T')[0];

      const timeMin = `${firstDay}T00:00:00Z`;
      const timeMax = `${lastDay}T23:59:59Z`;

      const gEvents = await fetchGoogleCalendarEvents(accessToken, timeMin, timeMax);

      const existingGoogleIds = new Set(events.map(e => e.googleEventId).filter(Boolean));
      const newImported: CalendarEvent[] = [];

      for (const g of gEvents) {
        if (existingGoogleIds.has(g.id)) continue; // skip already imported

        let dateStr = '';
        let startTimeStr = '09:00';
        let endTimeStr = '10:00';
        let isAllDay = false;

        if (g.start.date) {
          dateStr = g.start.date;
          isAllDay = true;
        } else if (g.start.dateTime) {
          const d = new Date(g.start.dateTime);
          dateStr = d.toISOString().split('T')[0];
          startTimeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

          if (g.end?.dateTime) {
            const endD = new Date(g.end.dateTime);
            endTimeStr = `${String(endD.getHours()).padStart(2, '0')}:${String(endD.getMinutes()).padStart(2, '0')}`;
          }
        }

        if (!dateStr) continue;

        newImported.push({
          id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: g.summary || 'Sem título',
          memberId: 'all',
          date: dateStr,
          startTime: isAllDay ? '' : startTimeStr,
          endTime: isAllDay ? '' : endTimeStr,
          isAllDay,
          category: 'other',
          description: g.description || undefined,
          location: g.location || undefined,
          priority: 'normal',
          reminderMinutes: 30,
          googleEventId: g.id,
          isSyncedWithGoogle: true,
          completed: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      if (newImported.length > 0) {
        onImportEvents(newImported);
        setStatusMessage(`${newImported.length} novo(s) evento(s) importado(s) da Google Agenda!`);
      } else {
        setStatusMessage('Sua agenda já está totalmente atualizada.');
      }

      const nowIso = new Date().toISOString();
      onSetLastSyncTime(nowIso);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao importar da Google Agenda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div
        id="google-sync-modal"
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-[#1f1f27] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-[#1f1f27] bg-slate-50/50 dark:bg-[#16161e]/50">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Cloud className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Sincronização Google Calendar
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

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs custom-scrollbar">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Account Status Card */}
          {user && accessToken ? (
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 dark:bg-[#16161e] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-blue-400/40"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {user.displayName?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {user.displayName || 'Conta Google Conectada'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {user.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-logout-google"
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-[#0d0d12] transition-colors cursor-pointer"
                  title="Desconectar conta Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {lastSyncTime && (
                <div className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-[#23232e]">
                  <RefreshCw className="w-3 h-3 animate-spin-slow" />
                  <span>Última sincronização: {new Date(lastSyncTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-3 space-y-3">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Conecte seu Google Calendar para sincronizar os compromissos da família com o seu celular e receber notificações integradas na sua agenda.
              </p>

              {/* Standard Sign in with Google Button */}
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  id="btn-signin-google"
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-3 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-[#23232e] bg-white dark:bg-[#16161e] hover:bg-slate-50 dark:hover:bg-[#1f1f27] text-slate-700 dark:text-white font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isLoading ? 'Conectando...' : 'Entrar com o Google'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Sync Actions (Available when connected) */}
          {user && accessToken && (
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                id="btn-push-google"
                onClick={handlePushToGoogle}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-[#23232e] bg-slate-50 dark:bg-[#16161e] hover:bg-slate-100 dark:hover:bg-[#1a1a24] text-slate-800 dark:text-white font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ArrowUpRight className="w-4 h-4 text-blue-500" />
                  <div className="text-left">
                    <p className="text-xs">Enviar da Família para o Google</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      Exporta todos os compromissos desta semana para sua agenda
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-blue-500 font-bold">Exportar</span>
              </button>

              <button
                type="button"
                id="btn-pull-google"
                onClick={handlePullFromGoogle}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-[#23232e] bg-slate-50 dark:bg-[#16161e] hover:bg-slate-100 dark:hover:bg-[#1a1a24] text-slate-800 dark:text-white font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                  <div className="text-left">
                    <p className="text-xs">Trazer da Agenda Google para cá</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      Importa os eventos marcados na sua conta Google para esta semana
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-500 font-bold">Importar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
