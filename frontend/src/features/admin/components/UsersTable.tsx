import { ACCOUNT_STATUS, ROLE_APP, type AccountStatus, type AuthUser } from '@/features/auth';
import { formatFullDate } from '@/shared/lib/formatDate';
import { Avatar, Button, Icon, type IconName } from '@/shared/ui';
import { ACCOUNT_STATUS_LABELS, ADMIN_LABELS, ROLE_APP_LABELS } from '../labels';
import type { AccountAction } from './AccountActionDialog';
import styles from './UsersTable.module.css';

type UsersTableProps = {
  users: AuthUser[];
  /** Compte de l'admin connecté : affiché, jamais actionnable (on ne se bloque pas soi-même). */
  currentUserId: string;
  onAction: (action: AccountAction) => void;
};

const text = ADMIN_LABELS.users;

// Le statut combine toujours une icône, un libellé et une couleur (DESIGN.md §1).
const STATUS_ICONS: Record<AccountStatus, IconName> = { ACTIVE: 'check', SUSPENDED: 'lock', DEACTIVATED: 'close' };
const STATUS_CLASSES: Record<AccountStatus, string> = {
  ACTIVE: styles.active,
  SUSPENDED: styles.blocked,
  DEACTIVATED: styles.deactivated,
};

/**
 * Tableau des comptes. Sous 760 px chaque ligne devient une carte (CSS) ; les rôles ARIA explicites gardent
 * la sémantique de tableau quand `display` change.
 */
export function UsersTable({ users, currentUserId, onAction }: UsersTableProps) {
  return (
    <table className={styles.table} role="table">
      <caption className={styles.caption}>{text.caption}</caption>
      <thead role="rowgroup">
        <tr role="row">
          <th role="columnheader" scope="col">
            {text.columns.account}
          </th>
          <th role="columnheader" scope="col">
            {text.columns.role}
          </th>
          <th role="columnheader" scope="col">
            {text.columns.status}
          </th>
          <th role="columnheader" scope="col" className={styles.number}>
            {text.columns.points}
          </th>
          <th role="columnheader" scope="col">
            {text.columns.since}
          </th>
          <th role="columnheader" scope="col" className={styles.actionHead}>
            {text.columns.action}
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {users.map((user) => (
          <tr key={user.user_id} role="row" className={styles.row}>
            <th role="rowheader" scope="row">
              <span className={styles.account}>
                <Avatar name={user.email} size={38} />
                <span className={styles.identity}>
                  <span className={styles.email}>
                    {user.email}
                    {user.user_id === currentUserId && <span className={styles.you}>{text.you}</span>}
                  </span>
                  <span className={styles.id}>{text.accountId(user.user_id)}</span>
                </span>
              </span>
            </th>
            <td role="cell" data-label={text.columns.role}>
              <span className={user.role === ROLE_APP.USER ? undefined : styles.staff}>
                {user.role !== ROLE_APP.USER && <Icon name="shield" size={16} />}
                {ROLE_APP_LABELS[user.role]}
              </span>
            </td>
            <td role="cell" data-label={text.columns.status}>
              <span className={`${styles.status} ${STATUS_CLASSES[user.account_status]}`}>
                <Icon name={STATUS_ICONS[user.account_status]} size={14} strokeWidth={2.4} />
                {ACCOUNT_STATUS_LABELS[user.account_status]}
              </span>
            </td>
            <td role="cell" data-label={text.columns.points} className={styles.number}>
              {user.points}
            </td>
            <td role="cell" data-label={text.columns.since}>
              {formatFullDate(user.created_at)}
            </td>
            <td role="cell" className={styles.action}>
              <RowAction user={user} own={user.user_id === currentUserId} onAction={onAction} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type RowActionProps = { user: AuthUser; own: boolean; onAction: (action: AccountAction) => void };

function RowAction({ user, own, onAction }: RowActionProps) {
  if (own) return <span className={styles.none}>{text.ownAccount}</span>;
  if (user.account_status === ACCOUNT_STATUS.ACTIVE) {
    return (
      <Button
        variant="secondary"
        className={styles.block}
        aria-label={text.blockAccount(user.email)}
        onClick={() => onAction({ kind: 'block', user })}
      >
        {text.block}
      </Button>
    );
  }
  if (user.account_status === ACCOUNT_STATUS.SUSPENDED) {
    return (
      <Button
        variant="secondary"
        aria-label={text.unblockAccount(user.email)}
        onClick={() => onAction({ kind: 'unblock', user })}
      >
        {text.unblock}
      </Button>
    );
  }
  // `DEACTIVATED` : fermé par son propriétaire, l'API ne sait pas le rouvrir.
  return <span className={styles.none}>{text.closedByOwner}</span>;
}
