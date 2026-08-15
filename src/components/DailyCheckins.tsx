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

  const stateByMember = useMemo(
    () => new Map(checkins.map((item) => [item.memberId, item])),
    [checkins],
  );

  const toggle = async (memberId: string, habit: DailyHabit) => {
    const current = stateByMember.get(memberId);
    const nextValue = !(current?.[habit] ?? false);

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

  const MemberDots = ({ habit }: { habit: DailyHabit }) => (
    <div className="flex items-center gap-1.5">
      {members.map((member) => {
        const done = stateByMember.get(member.id)?.[habit] ?? false;
        return (
          <button
            key={`${habit}-${member.id}`}
            type="button"
            onClick={() => void toggle(member.id, habit)}
            className={`relative w-8 h-8 rounded-full flex items-center justify-center text-sm border transition-all active:scale-95 ${done
              ? 'bg-emerald-500/12 border-emerald-500/40'
              : 'bg-slate-50 dark:bg-[#181821] border-slate-200 dark:border-[#2a2a36]'
            }`}
            aria-pressed={done}
            aria-label={`${member.name}: ${habit === 'water' ? 'água' : 'devocional'} ${done ? 'feito' : 'pendente'}`}
            title={`${member.name}: ${done ? 'feito' : 'pendente'}`}
          >
            <span>{member.avatar}</span>
            {done && (
              <span className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-[#111118]">
                <Check className="w-2.5 h-2.5" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <section className="daily-checkins" aria-label="Lembretes diários">
      {/* Mobile: duas linhas simples, sem textos auxiliares. */}
      <div className="sm:hidden rounded-2xl border border-slate-200/80 dark:border-[#252531] bg-white/90 dark:bg-[#121219]/90 divide-y divide-slate-100 dark:divide-[#252531] overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Droplets className="w-4 h-4 text-sky-500 shrink-0" />
            <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">Já bebeu água hoje?</span>
          </div>
          <MemberDots habit="water" />
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpenCheck className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">Já fez sua devocional?</span>
          </div>
          <MemberDots habit="devotional" />
        </div>
        {syncIssue && (
          <div className="flex items-center justify-center gap-1 px-3 py-1.5 text-[9px] text-amber-600 dark:text-amber-400">
            <WifiOff className="w-3 h-3" /> sincronização indisponível
          </div>
        )}
      </div>

      {/* Tablet/desktop: mantém contexto adicional. */}
      <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 gap-2">
        {([
          ['water', 'Já bebeu água hoje?', Droplets, 'text-sky-500'],
          ['devotional', 'Já fez sua devocional?', BookOpenCheck, 'text-amber-500'],
        ] as const).map(([habit, title, Icon, iconClass]) => {
          const completedCount = members.filter((member) => stateByMember.get(member.id)?.[habit]).length;
          return (
            <div key={habit} className="rounded-2xl border border-slate-200/80 dark:border-[#252531] bg-white/85 dark:bg-[#121219]/90 p-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-5 h-5 ${iconClass}`} />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
                    <p className="text-[10px] text-slate-400">{completedCount}/{members.length} concluído</p>
                  </div>
                </div>
                <MemberDots habit={habit} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
