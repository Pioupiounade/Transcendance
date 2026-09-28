import { ROLE_APP, type AuthUser } from '@/features/auth';
import { OPEN_STATUSES, type Action } from './types';

export interface UserOrgMembership {
  organization_id: string;
  role: 'MEMBER' | 'MANAGER' | 'OWNER';
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
}

/** Pourquoi l'utilisateur ne peut pas modifier ni annuler l'action ; `null` = il le peut. */
export type ManageBlocker = 'anonymous' | 'notOwner' | 'closed';

/** Miroir des règles de `PATCH /actions/:id` et `/cancel`. */
export const manageBlocker = (
  action: Pick<Action, 'creator_id' | 'status' | 'organization_id'>,
  user: Pick<AuthUser, 'user_id' | 'role'> | null,
  userMemberships: UserOrgMembership[] = [],
): ManageBlocker | null => {
  if (user === null) return 'anonymous';

  const isCreator = user.user_id === action.creator_id;
  const isAdmin = user.role === ROLE_APP.ADMIN;

  let isManagerOrOwner = false;
  if (action.organization_id) {
    const membership = userMemberships.find(
      (m) => m.organization_id === action.organization_id,
    );
    isManagerOrOwner =
      membership?.status === 'ACTIVE' &&
      (membership.role === 'MANAGER' || membership.role === 'OWNER');
  }

  if (!isCreator && !isAdmin && !isManagerOrOwner) return 'notOwner';
  if (!OPEN_STATUSES.includes(action.status)) return 'closed';

  return null;
};

export const canManageAction = (
  action: Pick<Action, 'creator_id' | 'status' | 'organization_id'>,
  user: Pick<AuthUser, 'user_id' | 'role'> | null,
  userMemberships: UserOrgMembership[] = [],
): boolean => manageBlocker(action, user, userMemberships) === null;