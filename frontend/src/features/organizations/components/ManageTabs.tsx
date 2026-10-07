import type { KeyboardEvent } from 'react';
import { panelId, tabId } from '../manageTabIds';
import styles from './ManageTabs.module.css';

export type ManageTab<T extends string> = { id: T; label: string; count?: number };

type ManageTabsProps<T extends string> = {
  /** Nom accessible de la liste d'onglets. */
  label: string;
  tabs: readonly ManageTab<T>[];
  value: T;
  onChange: (id: T) => void;
};

/**
 * Onglets (motif ARIA « tabs ») : un seul onglet dans l'ordre de tabulation, flèches gauche / droite pour changer.
 * Les panneaux sont rendus par la page avec `role="tabpanel"`, `id={panelId(x)}` et `aria-labelledby={tabId(x)}`.
 */
export function ManageTabs<T extends string>({ label, tabs, value, onChange }: ManageTabsProps<T>) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const index = tabs.findIndex((tab) => tab.id === value);
    const next = tabs[(index + step + tabs.length) % tabs.length];
    onChange(next.id);
    document.getElementById(tabId(next.id))?.focus();
  };

  return (
    <div className={styles.tabs} role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={tabId(tab.id)}
          aria-selected={tab.id === value}
          aria-controls={panelId(tab.id)}
          tabIndex={tab.id === value ? 0 : -1}
          className={styles.tab}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && <span className={styles.count}>{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
