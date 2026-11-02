import { useState, useEffect } from 'react';
import { ACCOUNT_STATUS, useAuth, type AuthUser } from '@/features/auth';
import { useResource } from '@/shared/hooks/useResource';
import { pageTitle } from '@/shared/lib/pageTitle';
import { Button, Chip, ConfirmDialog, FloatingField, Icon, type Confirmation } from '@/shared/ui';
import { blockUser, changeUserRole, deleteUserAccount, fetchUsers, unblockUser } from '../api/adminUsersApi';
import { AdminAccountCreator } from '../components/AdminAccountCreator';
import { AdminProfileEditor } from '../components/AdminProfileEditor';
import { UsersTable } from '../components/UsersTable';
import { toAccountErrorMessage } from '../errors';
import { useAdminList } from '../hooks/useAdminList';
import { ACCOUNT_STATUS_LABELS, ADMIN_LABELS } from '../labels';
import type { AccountActionKind } from '../types';
import styles from './AdminPage.module.css';

type AdminUsersPageProps = {
  /** Fiche publique d'un compte et la mienne : la feature n'importe pas `app/`. */
  profilePath: (userId: string) => string;
  ownProfilePath: string;
};

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

/**
 * `/admin/users` (#22, #196) : tous les comptes, recherche par e-mail, filtre par statut ; bloquer / débloquer,
 * créer un compte, modifier un profil, changer le rôle, supprimer. Chaque geste qui coûte passe par ConfirmDialog.
 */
export function AdminUsersPage(_props: AdminUsersPageProps) {
  const { user: me } = useAuth();
  const { data, loading, error, reload } = useResource(fetchUsers);
  const list = useAdminList(data ?? NO_USERS, LIST);
  const resetList = list.reset;

  useEffect(() => {
    const handleDirectoryChanged = (event: Event) => {
      const { resource } = (
        event as CustomEvent<{ resource: string }>
      ).detail;

      if (resource !== 'users') return;

      resetList();
      reload();
    };

    window.addEventListener(
      'admin:directory-changed',
      handleDirectoryChanged,
    );

    return () => {
      window.removeEventListener(
        'admin:directory-changed',
        handleDirectoryChanged,
      );
    };
  }, [reload, resetList]);

  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);

  // Un compte supprimé ailleurs : on referme ce qui le concernait.
  useEffect(() => {
    const handleUserDeleted = (event: Event) => {
      const { userId } = (event as CustomEvent<{ userId: string }>).detail;
      setEditingUser((current) => (current?.user_id === userId ? null : current));
      setConfirmation(null);
    };
    window.addEventListener('user:deleted', handleUserDeleted);
    return () => window.removeEventListener('user:deleted', handleUserDeleted);
  }, []);

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
        list.replace({ ...user, ...account });
        setNotice(kind === 'block' ? text.blocked(account.email) : text.unblocked(account.email));
      },
    });
  };

  const askRoleChange = (account: AuthUser, role: 'USER' | 'ADMIN') => {
    const promoting = role === 'ADMIN';
    const copy = promoting ? ADMIN_LABELS.dialog.promote : ADMIN_LABELS.dialog.demote;
    setConfirmation({
      title: copy.title,
      body: copy.body(account.email),
      effects: copy.effects,
      confirmLabel: copy.confirm,
      confirmingLabel: copy.confirming,
      danger: true,
      run: async () => {
        const updated = await changeUserRole(account.user_id, role);
        list.replace({ ...account, ...updated });
        setNotice(promoting ? text.promoted(updated.email) : text.demoted(updated.email));
      },
    });
  };

  const askDelete = (account: AuthUser) => {
    const copy = ADMIN_LABELS.dialog.deleteAccount;
    setConfirmation({
      title: copy.title,
      body: copy.body(account.email),
      effects: copy.effects,
      confirmLabel: copy.confirm,
      confirmingLabel: copy.confirming,
      danger: true,
      run: async () => {
        await deleteUserAccount(account.user_id);
        setEditingUser((current) => (current?.user_id === account.user_id ? null : current));
        list.reset();
        reload();
        setNotice(text.deleted);
      },
    });
  };

  const retry = () => {
    list.reset();
    reload();
  };

  useEffect(() => {
    const handleUserDeleted = (event: Event) => {
      const { userId } = (
        event as CustomEvent<{ userId: string }>
      ).detail;

      setEditingUser((current) =>
        current?.user_id === userId ? null : current,
      );
      setConfirmation(null);
    };

    window.addEventListener('user:deleted', handleUserDeleted);

    return () => {
      window.removeEventListener('user:deleted', handleUserDeleted);
    };
  }, []);

  return (
    <section className={styles.page}>
      <title>{pageTitle(text.title)}</title>
      <header className={styles.introRow}>
        <div className={styles.intro}>
          <h1>{text.title}</h1>
          <p className={styles.lead}>{text.lead}</p>
        </div>
        <Button onClick={() => setCreatingAccount(true)}>
          <Icon name="plus" size={16} strokeWidth={2.4} />
          {text.create}
        </Button>
      </header>
      <Button
        variant="secondary"
        onClick={() => setCreatingAccount(true)}
        disabled={creatingAccount}
      >
        Create account
      </Button>

      <AdminAccountCreator
        open={creatingAccount}
        onClose={() => setCreatingAccount(false)}
        onCreated={(email) => {
          setCreatingAccount(false);
          list.reset();
          reload();
          setNotice(`Account created: ${email}`);
        }}
      />
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

      {editingUser && (
        <AdminProfileEditor user={editingUser} onClose={() => setEditingUser(null)} />
      )}

      {list.rows.length > 0 && (
        <UsersTable
          users={list.rows}
          currentUserId={me?.user_id ?? ''}
          profilePath={(userId) => `/profiles/${userId}`}
          ownProfilePath="/profile"
          onAction={ask}
          onEditProfile={setEditingUser}
          onDeleteUser={askDelete}
          onChangeRole={askRoleChange}
        />
      )}
      {list.hidden > 0 && (
        <div className={styles.more}>
          <Button variant="secondary" onClick={list.showMore}>
            {common.more(list.nextPage)}
          </Button>
        </div>
      )}

      <AdminAccountCreator
        open={creatingAccount}
        onClose={() => setCreatingAccount(false)}
        onCreated={(email) => {
          setCreatingAccount(false);
          list.reset();
          reload();
          setNotice(text.created(email));
        }}
      />
      <AdminProfileEditor user={editingUser} onClose={() => setEditingUser(null)} />
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
