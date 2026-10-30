// D'après docs/api_contract.md §2 (enums) et §3 (formes `Organization`, `MemberWithUser`).
export const ORGANIZATION_STATUS = { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', CLOSED: 'CLOSED' } as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUS)[keyof typeof ORGANIZATION_STATUS];

export const ROLE_ORG = { OWNER: 'OWNER', MANAGER: 'MANAGER', MEMBER: 'MEMBER' } as const;
export type RoleOrg = (typeof ROLE_ORG)[keyof typeof ROLE_ORG];

export const MEMBER_STATUS = { PENDING: 'PENDING', ACTIVE: 'ACTIVE', REJECTED: 'REJECTED', BANNED: 'BANNED' } as const;
export type MemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];

export type Organization = {
  organization_id: string;
  title: string;
  description: string;
  organization_status: OrganizationStatus;
  address: string;
  /** `[latitude, longitude]`. */
  location: [number, number];
  creator_id: string | null;
  created_at: string;
  updated_at: string;
};

/** Membre actif d'une organisation avec son utilisateur (`profile` null = pas encore de profil). */
export type OrganizationMember = {
  organization_id: string;
  user_id: string;
  status: MemberStatus;
  role: RoleOrg;
  validated_by_org_man: boolean;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  user: {
    user_id: string;
    account_status: string;
    profile: {
      username: string;
      description: string | null;
      profile_picture: string | null;
    } | null;
  };
};

/** Adhésion telle que renvoyée par les routes d'écriture (`join`, `approve`…) : sans l'utilisateur. */
export type Membership = Omit<OrganizationMember, 'user'>;

/** Adhésion active d'un utilisateur, avec son organisation (`GET /organization-members/user/:id/organizations`). */
export type MembershipWithOrganization = Membership & { organization: Organization };

/** Commentaire public d'une organisation (`/organizations/:id/comments`) ; `profile` null = auteur sans profil. */
export type OrganizationComment = {
  comment_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  organization_id: string;
  user: {
    user_id: string;
    profile: {
      username: string;
      profile_picture: string | null;
    } | null;
  } | null;
};
