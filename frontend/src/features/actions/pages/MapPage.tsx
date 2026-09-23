import { useEffect, useMemo, useRef, useState } from 'react';
import { pageTitle } from '@/shared/lib/pageTitle';
import { prefersReducedMotion } from '@/shared/lib/prefersReducedMotion';
import { Button, Icon } from '@/shared/ui';
import { useActions } from '../api/useActions';
import { ActionCard } from '../components/ActionCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { NeighborhoodMap } from '../components/NeighborhoodMap';
import { ACTIONS_LABELS } from '../labels';
import { OPEN_STATUSES, type Category } from '../types';
import styles from './MapPage.module.css';

const text = ACTIONS_LABELS.map;

export function MapPage() {
  const { actions, loading, error, reload } = useActions();
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Mémoïsé : la carte se recadre quand cette liste change.
  const visible = useMemo(
    () =>
      actions.filter(
        (action) => OPEN_STATUSES.includes(action.status) && (category === null || action.category === category),
      ),
    [actions, category],
  );

  // Dérivé pendant le rendu : une sélection qui sort du filtre disparaît sans effet.
  const selected = selectedId !== null && visible.some((a) => a.action_id === selectedId) ? selectedId : null;

  useEffect(() => {
    if (selected === null) return;
    listRef.current
      ?.querySelector(`[data-action-id="${CSS.escape(selected)}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [selected]);

  const showEmpty = !loading && !error && visible.length === 0;

  return (
    <section className={styles.page}>
      <title>{pageTitle(text.title)}</title>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p className={styles.lead}>{text.lead}</p>
      </header>

      <CategoryFilter value={category} onChange={setCategory} />

      <div className={styles.layout}>
        <NeighborhoodMap actions={visible} selectedId={selected} onSelect={setSelectedId} />

        <aside className={styles.list} aria-label={text.listTitle}>
          <div className={styles.listTitle}>
            <h2>{text.listTitle}</h2>
            <span className={styles.count}>{visible.length}</span>
          </div>

          {loading && (
            <p className={styles.state} role="status">
              {text.loading}
            </p>
          )}
          {error && (
            <div className={styles.state} role="alert">
              <p>{text.error}</p>
              <Button variant="secondary" onClick={reload}>
                {text.retry}
              </Button>
            </div>
          )}
          {showEmpty && <p className={styles.state}>{actions.length === 0 ? text.empty : text.emptyFiltered}</p>}

          <ul ref={listRef} className={styles.cards}>
            {visible.map((action) => (
              <li key={action.action_id} data-action-id={action.action_id}>
                <ActionCard action={action} selected={action.action_id === selected} onSelect={setSelectedId} />
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <p className={styles.note}>
        <Icon name="lock" size={16} />
        {text.privacyNote}
      </p>
    </section>
  );
}
