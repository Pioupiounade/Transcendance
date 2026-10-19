export const NOTIFICATIONS_LABELS = {
  title: 'Notifications',
  bell: (unread: number) => (unread === 0 ? 'Notifications' : `Notifications, ${unread} unread`),
  badge: (unread: number) => (unread > 9 ? '9+' : String(unread)),
  markAllRead: 'Mark all as read',
  loading: 'Loading notifications…',
  error: 'The notifications could not be loaded.',
  empty: 'No notifications yet.',
  unread: 'Unread',
  justNow: 'Just now',
} as const;
