import { Link } from 'react-router';
import {
  ACTION_STATUS,
  ACTION_STATUS_LABELS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  type ActionStatus,
  type Category,
} from '@/features/actions';
import { formatDayMonth, formatTime } from '@/shared/lib/formatDate';
import { ButtonLink, Icon } from '@/shared/ui';
import { APP_LABELS } from '../../labels';
import { ROUTES } from '../../routes';
import styles from './MyActionsPanel.module.css';

export type AgendaItem = {
  id: string;
  title: string;
  category: Category;
  status: ActionStatus;
  scheduledAt: string;
  role: 'organiser' | 'participant';
  /** Destination du titre : modifier (organisateur) ou voir sur la carte (participant). */
  to: string;
};

type MyActionsPanelProps = {
  items: AgendaItem[];
  loading: boolean;
  error: boolean;
};

const text = APP_LABELS.pages.dashboard.agenda;
const note = APP_LABELS.pages.dashboard.note;
const VISIBLE = 4;

/** Panneau « My actions » : ce que j'organise et ce que j'ai rejoint, par date, boîte date à la maquette (profil). */
export function MyActionsPanel({ items, loading, error }: MyActionsPanelProps) {
  const visible = items.slice(0, VISIBLE);
  const hidden = items.length - visible.length;

  return (
    <aside className={styles.panel} aria-labelledby="agenda-title">
      <div className={styles.head}>
        <h2 id="agenda-title">{text.title}</h2>
        {!loading && !error && <span className={styles.count}>{items.length}</span>}
      </div>

      {loading && (
        <p className={styles.state} role="status">
          {text.loading}
        </p>
      )}
      {!loading && error && (
        <p className={styles.state} role="alert">
          {text.error}
        </p>
      )}
      {!loading && !error && items.length === 0 && (
        <div className={styles.empty}>
          <strong>{text.empty}</strong>
          <p>{text.emptyLead}</p>
          <ButtonLink to={ROUTES.createAction} size="md">
            <Icon name="plus" size={16} strokeWidth={2.4} />
            {APP_LABELS.pages.dashboard.suggest}
          </ButtonLink>
        </div>
      )}

      {visible.length > 0 && (
        <ul className={styles.list}>
          {visible.map((item) => {
            const date = formatDayMonth(item.scheduledAt);
            return (
              <li key={`${item.role}-${item.id}`} className={styles.row}>
                <span className={styles.date} aria-hidden="true">
                  <strong>{date?.day}</strong>
                  <small>{date?.month}</small>
                </span>
                <span className={styles.body}>
                  <Link to={item.to} className={styles.title}>
                    {item.title}
                  </Link>
                  <span className={styles.meta}>
                    <Icon name={CATEGORY_ICONS[item.category]} size={13} />
                    {CATEGORY_LABELS[item.category]} · {formatTime(item.scheduledAt)} ·{' '}
                    {item.role === 'organiser' ? text.organiser : text.participant}
                    {item.status === ACTION_STATUS.APPROVED && (
                      <span className={styles.confirmed}>{ACTION_STATUS_LABELS[item.status]}</span>
                    )}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {hidden > 0 && (
        <Link to={ROUTES.map} className={styles.more}>
          {text.more(hidden)}
        </Link>
      )}

      <div className={styles.note}>
        <Icon name="users" size={18} />
        <div>
          <strong>{note.title}</strong>
          <p>{note.body}</p>
        </div>
      </div>
    </aside>
  );
}
