import { useMemo } from 'react';
import { Link } from 'react-router';
import {
  ACTION_STATUS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  OPEN_STATUSES,
  useActions,
  type Action,
} from '@/features/actions';
import { formatDateTime } from '@/shared/lib/formatDate';
import { Icon } from '@/shared/ui';
import { ORGANIZATIONS_LABELS } from '../labels';
import styles from './OrganizationActions.module.css';

type OrganizationActionsProps = {
  organizationId: string;
  /**
   * Où mène une action à venir : `app/` le sait (la carte, centrée sur l'action). Les actions terminées n'ont pas
   * de lien tant que la fiche d'action est un mock (#60).
   */
  upcomingPath: (actionId: string) => string;
};

const text = ORGANIZATIONS_LABELS.actions;
const byDate = (a: Action, b: Action) => a.scheduled_at.localeCompare(b.scheduled_at);

/**
 * Ce que l'organisation fait et a fait : actions ouvertes (les plus proches d'abord), puis terminées.
 * Filtre côté client sur `GET /actions` : `GET /actions?organization_id=` répond 404 quand il n'y a rien, ce que
 * le navigateur inscrit en erreur dans la console (interdit par le sujet) pour chaque organisation sans action.
 */
export function OrganizationActions({ organizationId, upcomingPath }: OrganizationActionsProps) {
  const { actions, loading, error } = useActions();

  const { upcoming, completed } = useMemo(() => {
    const own = actions.filter((action) => action.organization_id === organizationId);
    return {
      upcoming: own.filter((action) => OPEN_STATUSES.includes(action.status)).sort(byDate),
      completed: own.filter((action) => action.status === ACTION_STATUS.COMPLETED).sort((a, b) => byDate(b, a)),
    };
  }, [actions, organizationId]);
  const total = upcoming.length + completed.length;

  return (
    <section className={styles.panel} aria-labelledby="organization-actions-title">
      <div className={styles.head}>
        <h2 id="organization-actions-title">{text.title}</h2>
        {!loading && !error && <span className={styles.count}>{total}</span>}
      </div>
      {loading && (
        <p className={styles.muted} role="status">
          {text.loading}
        </p>
      )}
      {error && (
        <p className={styles.muted} role="alert">
          {text.error}
        </p>
      )}
      {!loading && !error && total === 0 && <p className={styles.muted}>{text.empty}</p>}

      {upcoming.length > 0 && (
        <div className={styles.group}>
          <h3 className={styles.groupTitle}>{text.upcoming}</h3>
          <ul className={styles.list}>
            {upcoming.map((action) => (
              <li key={action.action_id}>
                <Link
                  to={upcomingPath(action.action_id)}
                  className={`${styles.item} ${styles.link}`}
                  aria-label={text.seeOnMap(action.title)}
                >
                  <ActionLine action={action} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {completed.length > 0 && (
        <div className={styles.group}>
          <h3 className={styles.groupTitle}>{text.completed}</h3>
          <ul className={styles.list}>
            {completed.map((action) => (
              <li key={action.action_id} className={styles.item}>
                <ActionLine action={action} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ActionLine({ action }: { action: Action }) {
  return (
    <>
      <span className={[styles.tag, styles[action.category.toLowerCase()]].filter(Boolean).join(' ')}>
        <Icon name={CATEGORY_ICONS[action.category]} size={14} />
        {CATEGORY_LABELS[action.category]}
      </span>
      <span className={styles.title}>{action.title}</span>
      <span className={styles.date}>{formatDateTime(action.scheduled_at)}</span>
    </>
  );
}
