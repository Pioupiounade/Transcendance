export type ProfileTabId = 'overview' | 'settings';

export const PROFILE_TABS: readonly { id: ProfileTabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'settings', label: 'Settings' },
] as const;

export function profileTabId(id: ProfileTabId): string {
  return `profile-tab-${id}`;
}

export function profilePanelId(id: ProfileTabId): string {
  return `profile-panel-${id}`;
}