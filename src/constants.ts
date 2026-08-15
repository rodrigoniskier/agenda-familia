import { CategoryInfo, FamilyMember } from './types';

export const CATEGORIES: CategoryInfo[] = [
  { id: 'family', label: 'Família', iconName: 'Users', color: 'indigo' },
  { id: 'school', label: 'Escola / Estudos', iconName: 'GraduationCap', color: 'blue' },
  { id: 'health', label: 'Saúde / Médico', iconName: 'HeartPulse', color: 'rose' },
  { id: 'sports', label: 'Esporte / Treino', iconName: 'Trophy', color: 'emerald' },
  { id: 'leisure', label: 'Lazer / Festa', iconName: 'Sparkles', color: 'amber' },
  { id: 'work', label: 'Trabalho', iconName: 'Briefcase', color: 'cyan' },
  { id: 'shopping', label: 'Compras / Casa', iconName: 'ShoppingBag', color: 'violet' },
  { id: 'other', label: 'Outro', iconName: 'CalendarCheck', color: 'slate' },
];

export const MEMBER_COLOR_PRESETS = [
  { id: 'blue', label: 'Azul Céu', bg: 'bg-sky-500', lightBg: 'bg-sky-50 dark:bg-sky-950/40', border: 'border-sky-500/40', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
  { id: 'rose', label: 'Rosa Flor', bg: 'bg-rose-500', lightBg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-500/40', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
  { id: 'emerald', label: 'Verde Esmeralda', bg: 'bg-emerald-500', lightBg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-500/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  { id: 'amber', label: 'Âmbar Solar', bg: 'bg-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-500/40', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  { id: 'purple', label: 'Roxo Violeta', bg: 'bg-purple-500', lightBg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-500/40', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  { id: 'teal', label: 'Verde Petróleo', bg: 'bg-teal-500', lightBg: 'bg-teal-50 dark:bg-teal-950/40', border: 'border-teal-500/40', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
  { id: 'orange', label: 'Laranja Coral', bg: 'bg-orange-500', lightBg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-500/40', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
];

export const INITIAL_MEMBERS: FamilyMember[] = [
  {
    id: 'm_rodrigo',
    name: 'Rodrigo',
    role: 'Pai',
    avatar: '👨',
    color: 'blue',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
    textColor: 'text-sky-700 dark:text-sky-300',
    borderColor: 'border-sky-400 dark:border-sky-700',
  },
  {
    id: 'm_erika',
    name: 'Erika',
    role: 'Mãe',
    avatar: '👩',
    color: 'rose',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    textColor: 'text-rose-700 dark:text-rose-300',
    borderColor: 'border-rose-400 dark:border-rose-700',
  },
  {
    id: 'm_sophia',
    name: 'Sophia',
    role: 'Filha',
    avatar: '👧',
    color: 'purple',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-400 dark:border-purple-700',
  },
];

export const REMINDER_OPTIONS = [
  { value: 0, label: 'Sem lembrete' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 120, label: '2 horas antes' },
  { value: 1440, label: '1 dia antes' },
];
