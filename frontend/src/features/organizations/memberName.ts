import { ORGANIZATIONS_LABELS } from './labels';
import type { OrganizationMember } from './types';

/** Nom affiché d'un membre côté gestion : son nom d'utilisateur, sinon « Neighbour #id » (compte sans profil). */
export const memberName = (member: OrganizationMember): string =>
  member.user.profile?.username ?? ORGANIZATIONS_LABELS.manage.anonymous(member.user_id);
