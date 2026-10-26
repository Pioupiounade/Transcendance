import type { KeyboardEvent } from 'react';
import { PROFILE_LABELS } from '../labels';
import { profilePanelId, profileTabId, type ProfileTabId } from '../profileTabIds';
import styles from './ProfileTabs.module.css';

type ProfileTabsProps = {
  tabs: readonly { id: ProfileTabId; label: string }[];
  value: ProfileTabId;
  onChange: (id: ProfileTabId) => void;
};

/** Onglets du profil (motif ARIA, flèches gauche / droite) : pilules blanches, l'actif en noir comme la nav. */
export function ProfileTabs({ tabs, value, onChange }: ProfileTabsProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const index = tabs.findIndex((tab) => tab.id === value);
    const next = tabs[(index + step + tabs.length) % tabs.length];
    onChange(next.id);
    document.getElementById(profileTabId(next.id))?.focus();
  };

  return (
    <div className={styles.tabs} role="tablist" aria-label={PROFILE_LABELS.tabs.nav} onKeyDown={onKeyDown}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={profileTabId(tab.id)}
          aria-selected={tab.id === value}
          aria-controls={profilePanelId(tab.id)}
          tabIndex={tab.id === value ? 0 : -1}
          className={styles.tab}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
