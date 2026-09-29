const dateFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const dayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric' });
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'short' });

const parse = (iso: string): Date | null => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** « Sat 12 Sept · 10:30 » à partir d'une date ISO ; chaîne vide si la date est invalide. */
export const formatDateTime = (iso: string): string => {
  const date = parse(iso);
  return date ? `${dateFormat.format(date)} · ${timeFormat.format(date)}` : '';
};

/** « 10:30 » ; chaîne vide si invalide. */
export const formatTime = (iso: string): string => {
  const date = parse(iso);
  return date ? timeFormat.format(date) : '';
};

/** Parties d'une « boîte date » (DESIGN.md §6 « Profile ») : `{ day: '12', month: 'Sept' }` ; `null` si invalide. */
export const formatDayMonth = (iso: string): { day: string; month: string } | null => {
  const date = parse(iso);
  return date ? { day: dayFormat.format(date), month: monthFormat.format(date) } : null;
};
