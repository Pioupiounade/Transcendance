const dateFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

/** « Sat 12 Sept · 10:30 » à partir d'une date ISO ; chaîne vide si la date est invalide. */
export const formatDateTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${dateFormat.format(date)} · ${timeFormat.format(date)}`;
};
