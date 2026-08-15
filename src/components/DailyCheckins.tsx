import React, { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, Check, Droplets, WifiOff } from 'lucide-react';
import { FamilyMember } from '../types';
import {
  DailyCheckin,
  DailyHabit,
  setDailyHabit,
  subscribeDailyCheckins,
} from '../services/dailyCheckins';

interface DailyCheckinsProps {
  members: FamilyMember[];
}

function localDateISO(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

export const DailyCheckins: React.FC<DailyCheckinsProps> = ({ members }) => {
  const [date] = useState(localDateISO);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [syncIssue, setSyncIssue] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeDailyCheckins(
      date,
      (next) => {
        setCheckins(next);
        setSyncIssue(false);
      },
      () => setSyncIssue(true),
    );
    return unsubscribe;
  }, [date]);

  const stateByMember = useMemo(() => {
    return new Map(checkins.map((item) => [item.memberId, item]));
  }, [checkins]);

  const toggle = async (memberId: string, habit: DailyHabit) => {
    const current = stateByMember.get(memberId);
    const nextValue = !(current?.[habit] ?? false);

    // Atualização otimista: o toque responde imediatamente, mesmo em rede lenta.
    setCheckins((previous) => {
      const existing = previous.find((item) => item.memberId === memberId);
      if (existing) {
        return previous.map((item) =>
          item.memberId === memberId
            ? { ...item, [habit]: nextValue, updatedAt: Date.now() }
            : item,
        );
      }
      return [
        ...previous,
        {
          id: `${date}_${memberId}`,
          date,
          memberId,
          water: habit === 'water' ? nextValue : false,
          devotional: habit === 'devotional' ? nextValue : false,
          updatedAt: Date.now(),
        },
      ];
    });

    try {
      await setDailyHabit(date, memberId, habit, nextValue);
      setSyncIssue(false);
    } catch (error) {
      console.warn('Não foi possível sincronizar o hábito diário.', error);
      setSyncIssue(true);
    }
  };

  const HabitCard = ({
    habit,
    title,
    subtitle,
  }: {
    habit: DailyHabit;
    title: string;
    subtitle: string;
  }) => {
    const Icon = habit === 'water' ? Droplets : BookOpenCheck;
    const completedCount = members.filter((member) => stateByMember.get(member.id)?.[habit]).length;

    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-[#252531] bg-white/85 dark:bg-[#121219]/90 p-3 sm:p-3.5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${habit === 'water' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">{completedCount}/{members.length}</span>
            </div>

            <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-0.5">
              {members.map((member) => {
                const done = stateByMember.get(member.id)?.[habit] ?? false;
                return (
                  <button
                    key={`${habit}-${member.id}`}
                    type="button"
                    onClick={() => void toggle(member.id, habit)}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition-all active:scale-95 ${done
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-[#181821] border-slate-200 dark:border-[#2a2a36] text-slate-600 dark:text-slate-300'
                    }`}
                    aria-pressed={done}
                    title={`${member.name}: ${done ? 'concluído' : 'ainda não'}`}
                  >
                    <span>{member.avatar}</span>
                    <span>{member.name}</span>
                    {done && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="pt-1.5" aria-label="Lembretes diários">
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Lembretes de hoje</span>
        {syncIssue && (
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400" title="A marcação será sincronizada quando a nuvem estiver disponível">
            <WifiOff className="w-3 h-3" /> nuvem indisponível
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <HabitCard habit="water" title="Já bebeu água hoje?" subtitle="Um lembrete simples para não deixar a hidratação passar." />
        <HabitCard habit="devotional" title="Já fez sua devocional?" subtitle="Separe um momento para Palavra e oração." />
      </div>
    </section>
  );
};
