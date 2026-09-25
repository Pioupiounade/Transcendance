import { ROLE_APP, type AuthUser } from '@/features/auth';
import { OPEN_STATUSES, type Action } from './types';

/** Pourquoi l'utilisateur ne peut pas modifier ni annuler l'action ; `null` = il le peut. */
export type ManageBlocker = 'anonymous' | 'notOwner' | 'closed';

/** Miroir des règles de `PATCH /actions/:id` et `/cancel` (docs/api_contract.md §15) : créateur ou ADMIN, action ouverte. */
export const manageBlocker = (
  action: Pick<Action, 'creator_id' | 'status'>,
  user: Pick<AuthUser, 'user_id' | 'role'> | null,
): ManageBlocker | null => {
  if (user === null) return 'anonymous';
  if (user.user_id !== action.creator_id && user.role !== ROLE_APP.ADMIN) return 'notOwner';
  if (!OPEN_STATUSES.includes(action.status)) return 'closed';
  return null;
};

export const canManageAction = (
  action: Pick<Action, 'creator_id' | 'status'>,
  user: Pick<AuthUser, 'user_id' | 'role'> | null,
): boolean => manageBlocker(action, user) === null;
