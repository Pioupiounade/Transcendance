import { useMemo, useState } from 'react';
import { ACCOUNT_STATUS, useAuth, type AccountStatus, type AuthUser } from '@/features/auth';
import { useResource } from '@/shared/hooks/useResource';
import { pageTitle } from '@/shared/lib/pageTitle';
import { Button, Chip, FloatingField, Icon } from '@/shared/ui';
import { fetchUsers } from '../api/adminUsersApi';
import { AccountActionDialog, type AccountAction } from '../components/AccountActionDialog';
import { UsersTable } from '../components/UsersTable';
import { ACCOUNT_STATUS_LABELS, ADMIN_LABELS } from '../labels';
import styles from './AdminUsersPage.module.css';

const text = ADMIN_LABELS.users;
const PAGE_SIZE = 20;
const STATUSES = Object.values(ACCOUNT_STATUS);
const NO_USERS: AuthUser[] = [];
// `GET /users` n'est pas trié : ordre de création (ids numériques renvoyés en chaînes).
const byId = (a: AuthUser, b: AuthUser) => Number(a.user_id) - Number(b.user_id);

/** `/admin/users` (#22) : tous les comptes, recherche par e-mail, filtre par statut, bloquer / débloquer. */
export function AdminUsersPage() {
  const { user: me } = useAuth();
  const { data, loading, error, reload } = useResource(fetchUsers);
  // Comptes modifiés depuis le chargement : la réponse du backend remplace la ligne, sans recharger la liste.
  const [updated, setUpdated] = useState<Record<string, AuthUser>>({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [action, setAction] = useState<AccountAction | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const users = useMemo(
    () => (data ?? NO_USERS).map((user) => updated[user.user_id] ?? user).sort(byId),
    [data, updated],
  );
  const counts = useMemo(() => {
    const result: Record<AccountStatus, number> = { ACTIVE: 0, SUSPENDED: 0, DEACTIVATED: 0 };
    for (const user of users) result[user.account_status] += 1;
    return result;
  }, [users]);
  const matching = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter(
      (user) => (status === null || user.account_status === status) && user.email.toLowerCase().includes(query),
    );
  }, [users, search, status]);

  const changeSearch = (value: string) => {
    setSearch(value);
    setVisible(PAGE_SIZE);
  };
  const changeStatus = (value: AccountStatus | null) => {
    setStatus(value);
    setVisible(PAGE_SIZE);
  };
  const retry = () => {
    setUpdated({});
    reload();
  };
  const done = (finished: AccountAction, account: AuthUser) => {
    setUpdated((current) => ({ ...current, [account.user_id]: account }));
    setNotice(finished.kind === 'block' ? text.blocked(account.email) : text.unblocked(account.email));
    setAction(null);
  };

  const hidden = matching.length - visible;

  return (
    <section className={styles.page}>
      <title>{pageTitle(text.title)}</title>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>
          <Icon name="shield" size={16} strokeWidth={2.2} />
          {text.eyebrow}
        </p>
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
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
          />
        </form>
        <div className={styles.filters} role="group" aria-label={text.filters}>
          <Chip pressed={status === null} onClick={() => changeStatus(null)}>
            {text.filterAll}
            <span className={styles.count}>{users.length}</span>
          </Chip>
          {STATUSES.map((value) => (
            <Chip key={value} pressed={status === value} onClick={() => changeStatus(value)}>
              {ACCOUNT_STATUS_LABELS[value]}
              <span className={styles.count}>{counts[value]}</span>
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
            {text.retry}
          </Button>
        </div>
      )}
      {!loading && !error && matching.length === 0 && (
        <p className={styles.state}>{users.length === 0 ? text.empty : text.noMatch}</p>
      )}

      {matching.length > 0 && (
        <UsersTable users={matching.slice(0, visible)} currentUserId={me?.user_id ?? ''} onAction={setAction} />
      )}
      {hidden > 0 && (
        <div className={styles.more}>
          <Button variant="secondary" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
            {text.more(Math.min(hidden, PAGE_SIZE))}
          </Button>
        </div>
      )}

      <AccountActionDialog action={action} onClose={() => setAction(null)} onDone={done} />
    </section>
  );
}
