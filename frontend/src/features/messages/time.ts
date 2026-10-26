import { MESSAGES_LABELS } from './labels';

const DAY_MS = 86_400_000;

const startOfDay = (date: Date): number => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** Clé de regroupement par jour (heure locale). */
export const dayKey = (iso: string): string => String(startOfDay(new Date(iso)));

/** « Today », « Yesterday », sinon « Tue 21 Oct » (et l'année si différente). */
export const dayLabel = (iso: string, now: Date = new Date()): string => {
  const date = new Date(iso);
  const diff = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (diff === 0) return MESSAGES_LABELS.day.today;
  if (diff === 1) return MESSAGES_LABELS.day.yesterday;
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
};

export const timeLabel = (iso: string): string =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
