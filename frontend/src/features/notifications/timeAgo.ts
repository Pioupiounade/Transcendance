import { formatFullDate } from '@/shared/lib/formatDate';
import { NOTIFICATIONS_LABELS } from './labels';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const relativeFormat = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' });

/** « 5 minutes ago », « yesterday »… jusqu'à une semaine, puis « 12 Sept 2026 » ; chaîne vide si la date est invalide. */
export const formatTimeAgo = (iso: string, now: number): string => {
  const elapsed = now - Date.parse(iso);
  if (elapsed < MINUTE) return NOTIFICATIONS_LABELS.justNow;
  if (elapsed < HOUR) return relativeFormat.format(-Math.floor(elapsed / MINUTE), 'minute');
  if (elapsed < DAY) return relativeFormat.format(-Math.floor(elapsed / HOUR), 'hour');
  if (elapsed < WEEK) return relativeFormat.format(-Math.floor(elapsed / DAY), 'day');
  return formatFullDate(iso);
};
