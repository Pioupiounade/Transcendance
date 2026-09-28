import { ActionCard, formatDistance, type Action } from '@/features/actions';
import { Button, ButtonLink } from '@/shared/ui';
import { APP_LABELS } from '../../labels';
import { ROUTES } from '../../routes';
import styles from './NearbyActions.module.css';

export type NearbyAction = { action: Action; distance: number };

type NearbyActionsProps = {
  items: NearbyAction[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
};

const text = APP_LABELS.pages.dashboard.nearby;

/** Suggestions : les actions ouvertes des voisins, les plus proches d'abord, en grille de cartes. */
export function NearbyActions({ items, selectedId, onSelect, loading, error, onRetry }: NearbyActionsProps) {
  return (
    <section className={styles.section} aria-labelledby="nearby-title">
      <div className={styles.head}>
        <div>
          <h2 id="nearby-title">{text.title}</h2>
          <p className={styles.lead}>{text.lead}</p>
        </div>
        <ButtonLink to={ROUTES.map} variant="secondary">
          {APP_LABELS.pages.dashboard.openMap}
        </ButtonLink>
      </div>

      {loading && (
        <p className={styles.state} role="status">
          {text.loading}
        </p>
      )}
      {!loading && error && (
        <div className={styles.state} role="alert">
          <p>{text.error}</p>
          <Button variant="secondary" onClick={onRetry}>
            {text.retry}
          </Button>
        </div>
      )}
      {!loading && !error && items.length === 0 && <p className={styles.state}>{text.empty}</p>}

      {items.length > 0 && (
        <ul className={styles.grid}>
          {items.map(({ action, distance }) => (
            <li key={action.action_id}>
              <ActionCard
                action={action}
                selected={action.action_id === selectedId}
                onSelect={onSelect}
                distance={formatDistance(distance)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
