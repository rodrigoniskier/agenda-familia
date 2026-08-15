import React, { useState } from 'react';
import { CalendarEvent, FamilyMember, WeekDay } from '../types';
import { formatWhatsAppSchedule, generateIcsFile } from '../services/notificationService';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Send,
  FileCode,
  Calendar,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface ShareExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  members: FamilyMember[];
  weekDays: WeekDay[];
}

export const ShareExportModal: React.FC<ShareExportModalProps> = ({
  isOpen,
  onClose,
  events,
  members,
  weekDays,
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'ical' | 'json'>('whatsapp');

  if (!isOpen) return null;

  const whatsappMessage = formatWhatsAppSchedule(events, members, weekDays);

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleDownloadIcs = () => {
    const icsContent = generateIcsFile(events, members);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendario-sales-barbosa-${weekDays[0]?.dateString || 'agenda'}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const backup = {
      version: '2.0',
      family: 'Família Sales-Barbosa',
      exportedAt: new Date().toISOString(),
      members,
      events,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-sales-barbosa-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div
        id="share-export-modal"
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-[#1f1f27] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-[#1f1f27] bg-slate-50/50 dark:bg-[#16161e]/50">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Compartilhar Calendário da Família
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

        {/* Tab Selection */}
        <div className="flex items-center p-2 border-b border-slate-200 dark:border-[#1f1f27] bg-slate-50/50 dark:bg-[#0d0d12] gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#16161e]'
            }`}
          >
            WhatsApp (Grupo Familiar)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ical')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'ical'
                ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#16161e]'
            }`}
          >
            Arquivo .ICS (Apple/Outlook)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'json'
                ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#16161e]'
            }`}
          >
            Backup JSON
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs custom-scrollbar">
          {activeTab === 'whatsapp' && (
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-400">
                Envie o resumo completo da semana formatado com horários e responsáveis direto no grupo da família no WhatsApp:
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#16161e] border border-slate-200 dark:border-[#23232e] text-slate-800 dark:text-slate-200 font-mono text-[11px] whitespace-pre-wrap max-h-60 overflow-y-auto select-all custom-scrollbar">
                {whatsappMessage}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  id="btn-copy-whatsapp"
                  onClick={handleCopyWhatsApp}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#23232e] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#16161e] font-bold transition-colors cursor-pointer"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Mensagem</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="btn-open-whatsapp"
                  onClick={handleOpenWhatsApp}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Abrir no WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ical' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-950 dark:text-indigo-200 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  <span>Sincronização com celulares e calendários nativos</span>
                </div>
                <p className="text-[11px] leading-relaxed text-indigo-800/90 dark:text-indigo-300">
                  O arquivo .ICS é o padrão universal para calendários. Ao baixar, você ou qualquer membro pode abri-lo no iPhone (Apple Calendar), Android, Google Agenda ou Outlook com todos os alarmes e lembretes configurados.
                </p>
              </div>

              <div className="text-center py-2">
                <button
                  type="button"
                  id="btn-download-ics"
                  onClick={handleDownloadIcs}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-[0_0_12px_rgba(79,70,229,0.4)] transition-all text-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo iCalendar (.ICS)</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-400">
                Exporte todos os compromissos e cadastros de membros para um arquivo JSON para salvar uma cópia de segurança.
              </p>

              <button
                type="button"
                id="btn-download-json"
                onClick={handleDownloadJson}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-[#23232e] text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-[#16161e] font-bold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Backup Completo (.JSON)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
