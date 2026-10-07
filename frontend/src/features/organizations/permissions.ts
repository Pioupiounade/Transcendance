import { MEMBER_STATUS, ROLE_ORG, type OrganizationMember, type RoleOrg } from './types';

/** Niveau de gestion : `owner` (propriétaire ou ADMIN de la plateforme), `manager`, ou aucun. */
export type ManagerLevel = 'owner' | 'manager' | null;

/** Miroir des règles du backend (docs/api_contract.md §13) : sert à n'afficher que ce qui aboutira. */
export const managerLevel = (role: RoleOrg | null, isAdmin: boolean): ManagerLevel => {
  if (isAdmin || role === ROLE_ORG.OWNER) return 'owner';
  return role === ROLE_ORG.MANAGER ? 'manager' : null;
};

export type MemberActionKind = 'promote' | 'demote' | 'transfer' | 'remove' | 'ban';

/**
 * Actions possibles sur un membre actif. Jamais sur soi-même ni sur le owner (il doit d'abord céder la
 * propriété) ; un manager ne retire et ne bannit que des `MEMBER` ; les rôles sont l'affaire du owner.
 */
export const memberActions = (level: ManagerLevel, target: OrganizationMember, selfId: string): MemberActionKind[] => {
  if (level === null || target.status !== MEMBER_STATUS.ACTIVE) return [];
  if (target.user_id === selfId || target.role === ROLE_ORG.OWNER) return [];
  if (level === 'manager') return target.role === ROLE_ORG.MEMBER ? ['remove', 'ban'] : [];
  return [target.role === ROLE_ORG.MEMBER ? 'promote' : 'demote', 'transfer', 'remove', 'ban'];
};
