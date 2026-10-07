import type { AccountStatus, RoleApp } from '@/features/auth';

// UI texts of the admin area (English). The ticket says « block / unblock », the API « suspend / reactivate ».
export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Blocked',
  DEACTIVATED: 'Deactivated',
};

export const ROLE_APP_LABELS: Record<RoleApp, string> = { USER: 'User', ADMIN: 'Admin', MODERATOR: 'Moderator' };

export const ADMIN_LABELS = {
  users: {
    eyebrow: 'Administration',
    title: 'Accounts',
    lead: 'Every account of the platform. Block one that breaks the rules, unblock it once the matter is settled.',
    search: 'Search by e-mail',
    filters: 'Filter by status',
    filterAll: 'All',
    caption: 'Accounts of the platform',
    columns: { account: 'Account', role: 'Role', status: 'Status', points: 'Points', since: 'Member since', action: 'Action' },
    accountId: (id: string) => `Account #${id}`,
    you: 'You',
    block: 'Block',
    unblock: 'Unblock',
    blockAccount: (email: string) => `Block ${email}`,
    unblockAccount: (email: string) => `Unblock ${email}`,
    ownAccount: 'Your own account',
    closedByOwner: 'Closed by its owner',
    blocked: (email: string) => `${email} is now blocked.`,
    unblocked: (email: string) => `${email} is active again.`,
    loading: 'Loading accounts…',
    error: 'The accounts could not be loaded.',
    retry: 'Try again',
    empty: 'No account yet.',
    noMatch: 'No account matches this search.',
    more: (count: number) => `Show ${count} more`,
  },
  dialog: {
    close: 'Close',
    cancel: 'Cancel',
    block: {
      title: 'Block this account?',
      body: (email: string) => `${email} will be suspended.`,
      effects: [
        'It can no longer create or join actions and organizations.',
        'Its public profile is hidden.',
        'It loses 50 points, which are not given back when you unblock it.',
      ],
      confirm: 'Block account',
      confirming: 'Blocking…',
    },
    unblock: {
      title: 'Unblock this account?',
      body: (email: string) => `${email} will be active again and can take part as before.`,
      effects: ['The 50 points lost when it was blocked are not given back.'],
      confirm: 'Unblock account',
      confirming: 'Unblocking…',
    },
  },
  errors: {
    network: 'The server cannot be reached. Check your connection and try again.',
    signedOut: 'Your session has expired. Sign in again.',
    notAllowed: 'Only an admin can do this.',
    notFound: 'This account no longer exists.',
    rejected: (reason: string) => `The server refused: ${reason}`,
    unknown: 'Something went wrong. Try again.',
  },
} as const;
