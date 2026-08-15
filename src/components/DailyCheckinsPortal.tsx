import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { INITIAL_MEMBERS } from '../constants';
import { DailyCheckins } from './DailyCheckins';

export const DailyCheckinsPortal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-reminders-title"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 dark:border-[#292934] bg-white dark:bg-[#111118] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            <p id="daily-reminders-title" className="text-base font-bold text-slate-900 dark:text-white">
              Antes de começar
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Dois lembretes rápidos de hoje.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 dark:active:bg-[#1c1c25]"
            aria-label="Fechar lembretes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3">
          <DailyCheckins members={INITIAL_MEMBERS} />
        </div>

        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full rounded-2xl bg-indigo-600 text-white text-sm font-semibold py-3 active:scale-[0.99] transition-transform"
          >
            Continuar para a agenda
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
