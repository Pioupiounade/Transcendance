import { useState } from 'react';
import { ACCOUNT_STATUS, useAuth, type AuthUser } from '@/features/auth';
import { useResource } from '@/shared/hooks/useResource';
import { pageTitle } from '@/shared/lib/pageTitle';
import { Button, Chip, ConfirmDialog, FloatingField, Icon, type Confirmation } from '@/shared/ui';
import { blockUser, fetchUsers, unblockUser } from '../api/adminUsersApi';
import { UsersTable } from '../components/UsersTable';
import { toAccountErrorMessage } from '../errors';
import { useAdminList } from '../hooks/useAdminList';
import { ACCOUNT_STATUS_LABELS, ADMIN_LABELS } from '../labels';
import type { AccountActionKind } from '../types';
import styles from './AdminPage.module.css';

const text = ADMIN_LABELS.users;
const common = ADMIN_LABELS.list;
const NO_USERS: AuthUser[] = [];
const LIST = {
  id: (user: AuthUser) => user.user_id,
  status: (user: AuthUser) => user.account_status,
  statuses: Object.values(ACCOUNT_STATUS),
  text: (user: AuthUser) => user.email,
};
const REQUESTS: Record<AccountActionKind, (id: string) => Promise<AuthUser>> = { block: blockUser, unblock: unblockUser };

/** `/admin/users` (#22) : tous les comptes, recherche par e-mail, filtre par statut, bloquer / débloquer. */
export function AdminUsersPage() {
  const { user: me } = useAuth();
  const { data, loading, error, reload } = useResource(fetchUsers);
  const list = useAdminList(data ?? NO_USERS, LIST);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Le blocage coûte 50 points au compte : jamais en un clic.
  const ask = (kind: AccountActionKind, user: AuthUser) => {
    const copy = ADMIN_LABELS.dialog[kind];
    setConfirmation({
      title: copy.title,
      body: copy.body(user.email),
      effects: copy.effects,
      confirmLabel: copy.confirm,
      confirmingLabel: copy.confirming,
      danger: kind === 'block',
      run: async () => {
        const account = await REQUESTS[kind](user.user_id);
        list.replace(account);
        setNotice(kind === 'block' ? text.blocked(account.email) : text.unblocked(account.email));
      },
    });
  };
  const retry = () => {
    list.reset();
    reload();
  };

  return (
    <section className={styles.page}>
      <title>{pageTitle(text.title)}</title>
      <header className={styles.intro}>
        <h1>{text.title}</h1>
        <p className={styles.lead}>{text.lead}</p>
      </header>

      <div className={styles.toolbar}>
        <form className={styles.search} role="search" onSubmit={(event) => event.preventDefault()}>
          <FloatingField
            id="admin-user-search"
            type="text"
            label={text.search}
            autoComplete="off"
            value={list.search}
            onChange={(event) => list.changeSearch(event.target.value)}
          />
        </form>
        <div className={styles.filters} role="group" aria-label={common.filters}>
          <Chip pressed={list.filter === null} onClick={() => list.changeFilter(null)}>
            {common.filterAll}
            <span className={styles.count}>{list.total}</span>
          </Chip>
          {LIST.statuses.map((value) => (
            <Chip key={value} pressed={list.filter === value} onClick={() => list.changeFilter(value)}>
              {ACCOUNT_STATUS_LABELS[value]}
              <span className={styles.count}>{list.counts[value]}</span>
            </Chip>
          ))}
        </div>
      </div>

      {notice && (
        <p className={styles.notice} role="status">
          <Icon name="check" size={16} strokeWidth={2.4} />
          {notice}
        </p>
      )}

      {loading && (
        <p className={styles.state} role="status">
          {text.loading}
        </p>
      )}
      {error && (
        <div className={styles.state} role="alert">
          <p>{text.error}</p>
          <Button variant="secondary" onClick={retry}>
            {common.retry}
          </Button>
        </div>
      )}
      {!loading && !error && list.matching.length === 0 && (
        <p className={styles.state}>{list.total === 0 ? text.empty : text.noMatch}</p>
      )}

      {list.rows.length > 0 && <UsersTable users={list.rows} currentUserId={me?.user_id ?? ''} onAction={ask} />}
      {list.hidden > 0 && (
        <div className={styles.more}>
          <Button variant="secondary" onClick={list.showMore}>
            {common.more(list.nextPage)}
          </Button>
        </div>
      )}

      <ConfirmDialog
        confirmation={confirmation}
        onClose={() => setConfirmation(null)}
        cancelLabel={ADMIN_LABELS.dialog.cancel}
        closeLabel={ADMIN_LABELS.dialog.close}
        toErrorMessage={toAccountErrorMessage}
      />
    </section>
  );
}
