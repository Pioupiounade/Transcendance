import type { OrganizationStatus, RoleOrg } from './types';

export const ORGANIZATION_STATUS_LABELS: Record<OrganizationStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  CLOSED: 'Closed',
};

export const ROLE_ORG_LABELS: Record<RoleOrg, string> = { OWNER: 'Owner', MANAGER: 'Manager', MEMBER: 'Member' };

export const ORGANIZATIONS_LABELS = {
  list: {
    eyebrow: 'Around you',
    title: 'The organizations of the neighbourhood.',
    lead: 'Associations, shops and collectives that organise actions near you.',
    search: 'Search an organization',
    count: (count: number) => (count === 1 ? '1 organization' : `${count} organizations`),
    loading: 'Loading organizations…',
    error: 'The organizations could not be loaded.',
    retry: 'Try again',
    empty: 'No organization yet.',
    noMatch: (query: string) => `Nothing matches “${query}”.`,
    all: 'All organizations',
  },
  constellation: {
    you: 'You',
    legend: 'The nearer to you, the closer to the centre.',
    hint: 'Drag an organization around, click it to open it.',
  },
  detail: {
    eyebrow: 'Organization',
    back: 'All organizations',
    loading: 'Loading the organization…',
    notFound: 'This organization does not exist or has been removed.',
    error: 'The organization could not be loaded.',
    about: 'About',
    since: (date: string) => `On the platform since ${date}`,
    members: 'Members',
    membersLoading: 'Loading members…',
    membersError: 'The members could not be loaded.',
    membersEmpty: 'No member yet.',
    anonymousMember: 'Neighbour',
  },
} as const;
