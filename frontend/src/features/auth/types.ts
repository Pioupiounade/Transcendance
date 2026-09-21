// D'après docs/api_contract.md §2 et §3.
export const ROLE_APP = { USER: 'USER', ADMIN: 'ADMIN', MODERATOR: 'MODERATOR' } as const;
export type RoleApp = (typeof ROLE_APP)[keyof typeof ROLE_APP];

export const ACCOUNT_STATUS = { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', DEACTIVATED: 'DEACTIVATED' } as const;
export type AccountStatus = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

/** Utilisateur renvoyé par `/auth/*` (sans `refresh_token`). */
export type AuthUser = {
  user_id: string;
  email: string;
  role: RoleApp;
  account_status: AccountStatus;
  points: number;
  created_at: string;
  updated_at: string;
};

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated';
