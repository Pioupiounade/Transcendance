import { ACCOUNT_STATUS, ROLE_APP, type AccountStatus, type AuthUser } from '@/features/auth';
import { formatFullDate } from '@/shared/lib/formatDate';
import { Avatar, Button, Icon, type IconName } from '@/shared/ui';
import { ACCOUNT_STATUS_LABELS, ADMIN_LABELS, ROLE_APP_LABELS } from '../labels';
import type { AccountActionKind } from '../types';
import { RowMenu, type RowMenuItem } from './RowMenu';
import table from './AdminTable.module.css';
import styles from './UsersTable.module.css';

type UsersTableProps = {
  users: AuthUser[];
  /** Compte de l'admin connecté : affiché, jamais sanctionné ni supprimé (on ne se bloque pas soi-même). */
  currentUserId: string;
  /** Fiche publique d'un compte, et la mienne (`/profile`) : chemins fournis par `app/`. */
  profilePath: (userId: string) => string;
  ownProfilePath: string;
  onAction: (kind: AccountActionKind, user: AuthUser) => void;
  onEditProfile: (user: AuthUser) => void;
  onDeleteUser: (user: AuthUser) => void;
  onChangeRole: (user: AuthUser, role: 'USER' | 'ADMIN') => void;
};

const text = ADMIN_LABELS.users;

const STATUS_ICONS: Record<AccountStatus, IconName> = { ACTIVE: 'check', SUSPENDED: 'lock', DEACTIVATED: 'close' };
const STATUS_CLASSES: Record<AccountStatus, string> = {
  ACTIVE: table.statusGood,
  SUSPENDED: table.statusBad,
  DEACTIVATED: table.statusMuted,
};

/**
 * Tableau des comptes. En bout de ligne : le geste de modération (bloquer / réactiver) et un menu « More » pour le
 * reste (fiche, profil, rôle, suppression), pour que la ligne reste une ligne. Sous 760 px chaque ligne devient une
 * carte (CSS) ; les rôles ARIA explicites gardent la sémantique de tableau quand `display` change.
 */
export function UsersTable({
  users,
  currentUserId,
  profilePath,
  ownProfilePath,
  onAction,
  onEditProfile,
  onDeleteUser,
  onChangeRole,
}: UsersTableProps) {
  const menuItems = (user: AuthUser, own: boolean): RowMenuItem[] => {
    const items: RowMenuItem[] = [
      { key: 'view', label: text.viewProfile, to: own ? ownProfilePath : profilePath(user.user_id) },
      { key: 'edit', label: text.editProfile, onSelect: () => onEditProfile(user) },
    ];
    if (own) return items;
    if (user.role === ROLE_APP.ADMIN) {
      items.push({ key: 'role', label: text.makeUser, onSelect: () => onChangeRole(user, 'USER') });
    } else if (user.role === ROLE_APP.USER) {
      items.push({
        key: 'role',
        label: text.makeAdmin,
        disabled: user.account_status !== ACCOUNT_STATUS.ACTIVE,
        hint: text.roleNeedsActive,
        onSelect: () => onChangeRole(user, 'ADMIN'),
      });
    }
    items.push({
      key: 'delete',
      label: text.deleteAccount,
      danger: true,
      disabled: user.deletionBlockedByOwnership === true,
      hint: text.deleteNeedsTransfer,
      onSelect: () => onDeleteUser(user),
    });
    return items;
  };

  return (
    <table className={table.table} role="table">
      <caption className={table.caption}>{text.caption}</caption>
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
          <th role="columnheader" scope="col" className={table.number}>
            {text.columns.points}
          </th>
          <th role="columnheader" scope="col">
            {text.columns.since}
          </th>
          <th role="columnheader" scope="col" className={table.actionHead}>
            {text.columns.action}
          </th>
        </tr>
      </thead>
<tbody role="rowgroup">
        {users.map((user) => {
          const own = user.user_id === currentUserId;
          const blockReason =
            !own && user.account_status === ACCOUNT_STATUS.ACTIVE ? (user.blockingOwnershipOrganization ?? null) : null;
          return (
            <tr key={user.user_id} role="row" className={table.row}>
              <th role="rowheader" scope="row">
                <span className={styles.account}>
                  <Avatar name={user.email} size={38} />
                  <span className={table.identity}>
                    <span className={`${table.name} ${styles.email}`}>
                      {user.email}
                      {own && <span className={styles.you}>{text.you}</span>}
                    </span>
                    <span className={table.meta}>
                      <span>{text.accountId(user.user_id)}</span>
                    </span>
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
                <span className={`${table.status} ${STATUS_CLASSES[user.account_status]}`}>
                  <Icon name={STATUS_ICONS[user.account_status]} size={14} strokeWidth={2.4} />
                  {ACCOUNT_STATUS_LABELS[user.account_status]}
                </span>
              </td>
              <td role="cell" data-label={text.columns.points} className={table.number}>
                {user.points}
              </td>
              <td role="cell" data-label={text.columns.since}>
                {formatFullDate(user.created_at)}
              </td>
              <td role="cell" className={table.action}>
                <span className={table.buttons}>
                  <RowAction user={user} own={own} onAction={onAction} />
                  <RowMenu text={text.more} label={text.moreFor(user.email)} items={menuItems(user, own)} />
                </span>
                {blockReason && (
                  <p id={`block-reason-${user.user_id}`} className={styles.hint}>
                    {text.blockNeedsTransfer(blockReason)}
                  </p>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

type RowActionProps = { user: AuthUser; own: boolean; onAction: UsersTableProps['onAction'] };

/** Le geste de modération du compte : bloquer un actif, réactiver un bloqué ; un texte quand il n'y en a pas. */
function RowAction({ user, own, onAction }: RowActionProps) {
  if (own) return <span className={table.none}>{text.ownAccount}</span>;
  if (user.account_status === ACCOUNT_STATUS.ACTIVE) {
    return (
      <Button
        variant="secondary"
        className={table.danger}
        disabled={Boolean(user.blockingOwnershipOrganization)}
        aria-label={text.blockAccount(user.email)}
        aria-describedby={user.blockingOwnershipOrganization ? `block-reason-${user.user_id}` : undefined}
        onClick={() => onAction('block', user)}
      >
        {text.block}
      </Button>
    );
  }
  if (user.account_status === ACCOUNT_STATUS.SUSPENDED || user.account_status === ACCOUNT_STATUS.DEACTIVATED) {
    return (
      <Button variant="secondary" aria-label={text.unblockAccount(user.email)} onClick={() => onAction('unblock', user)}>
        {text.unblock}
      </Button>
    );
  }
  return <span className={table.none}>{text.closedByOwner}</span>;
}
