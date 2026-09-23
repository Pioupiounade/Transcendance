import type { ActionStatus, Category } from './types';

// Seul endroit qui traduit les enums de l'API (frontend/CLAUDE.md, « Appels API »).
export const CATEGORY_LABELS: Record<Category, string> = {
  ENVIRONMENT: 'Environment',
  SOCIAL: 'Mutual aid',
  CULTURAL: 'Culture & sharing',
};

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  PENDING: 'Upcoming',
  APPROVED: 'Confirmed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

export const ACTIONS_LABELS = {
  map: {
    eyebrow: 'Your neighbourhood',
    title: 'What is happening around you?',
    lead: 'Pick a pin or a card to see the details of an action.',
    filters: 'Filter by category',
    filterAll: 'All',
    mapLabel: 'Map of nearby actions',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    nearby: (count: number) => (count === 1 ? '1 action nearby' : `${count} actions nearby`),
    recenter: 'Recenter the map on the actions',
    locate: 'Show my position',
    locating: 'Locating…',
    locateUnavailable: 'Your position is not available.',
    youAreHere: 'You are here',
    listTitle: 'Where do we meet?',
    loading: 'Loading actions…',
    empty: 'No actions nearby yet. Be the first to suggest one!',
    emptyFiltered: 'No actions in this category yet.',
    error: 'The actions could not be loaded.',
    retry: 'Try again',
    privacyNote: 'Your precise location stays private.',
  },
} as const;
