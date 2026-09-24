import type { IconName } from '@/shared/ui';
import type { ActionStatus, Category } from './types';

// Seul endroit qui traduit les enums de l'API (frontend/CLAUDE.md, « Appels API »).
export const CATEGORY_LABELS: Record<Category, string> = {
  ENVIRONMENT: 'Environment',
  SOCIAL: 'Mutual aid',
  CULTURAL: 'Culture & sharing',
};

/** Icône de chaque catégorie (maquette : feuille, cœur, soleil), pour les puces, les tags et les pins. */
export const CATEGORY_ICONS: Record<Category, IconName> = {
  ENVIRONMENT: 'leaf',
  SOCIAL: 'heart',
  CULTURAL: 'sun',
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
  create: {
    hint: 'Tap the map to suggest an action there',
    draftPin: 'New action spot (drag to adjust)',
    popupTitle: 'Suggest an action here?',
    popupHint: 'Drag the pin to adjust the spot.',
    start: 'Suggest an action',
    signIn: 'Sign in to suggest an action',
    discard: 'Discard',
    dialogTitle: 'Suggest an action',
    dialogLead: 'Your neighbours will see it on the map once it is reviewed.',
    close: 'Close',
    submitted: 'Your action is on the map, pending review.',
  },
  form: {
    location: (latitude: number, longitude: number) => `Spot pinned at ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    title: 'Title',
    description: 'What will you do together?',
    category: 'Category',
    scheduledAt: 'When?',
    maxParticipants: 'Max participants (optional)',
    maxParticipantsHelp: (min: number) => `Leave empty for no limit, otherwise at least ${min}.`,
    submit: 'Submit for review',
    submitting: 'Submitting…',
    cancel: 'Cancel',
  },
  validation: {
    titleRequired: 'Give your action a title.',
    descriptionRequired: 'Describe what you will do together.',
    tooLong: (max: number) => `Keep it under ${max} characters.`,
    categoryRequired: 'Pick a category.',
    dateRequired: 'Choose a date and time.',
    dateInvalid: 'Enter a valid date and time.',
    datePast: 'Choose a date in the future.',
    maxParticipantsInvalid: (min: number) => `Enter a whole number of at least ${min}, or leave it empty.`,
  },
  errors: {
    signedOut: 'Your session has expired. Sign in again to submit your action.',
    notAllowed: 'You are not allowed to create this action.',
    rejected: (reason: string) => `The action was not accepted: ${reason}`,
    network: 'We could not reach the server. Check your connection and try again.',
    unknown: 'Something went wrong on our side. Please try again.',
  },
} as const;
