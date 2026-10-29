import { useEffect, useState } from 'react';
import {
  ORGANIZATION_STATUS,
  ORGANIZATION_STATUS_LABELS,
  closeOrganization,
  reopenOrganization,
  suspendOrganization,
  useOrganizations,
  fetchMemberships,
  reopenOrganizationWithOwner,
  type Organization,
} from '@/features/organizations';
import { pageTitle } from '@/shared/lib/pageTitle';
import { Button, Chip, ConfirmDialog, FloatingField, Icon, type Confirmation } from '@/shared/ui';
import { OrganizationsTable } from '../components/OrganizationsTable';
import { toOrganizationErrorMessage } from '../errors';
import { useAdminList } from '../hooks/useAdminList';
import { ADMIN_LABELS } from '../labels';
import type { OrganizationModerationKind } from '../types';
import styles from './AdminPage.module.css';
import type { AuthUser } from '@/features/auth';
import { fetchUsers } from '../api/adminUsersApi';

type AdminOrganizationsPageProps = {
  /** Fiche publique d'une organisation (`/organizations/:id`). */
  organizationPath: (id: string) => string;
};

const text = ADMIN_LABELS.organizations;
const common = ADMIN_LABELS.list;
const LIST = {
  id: (organization: Organization) => organization.organization_id,
  status: (organization: Organization) => organization.organization_status,
  statuses: Object.values(ORGANIZATION_STATUS),
  text: (organization: Organization) => organization.title,
};
// `reactivate` lève une suspension (ADMIN seulement) comme il rouvre une organisation fermée.
const REQUESTS: Record<OrganizationModerationKind, (id: string) => Promise<Organization>> = {
  suspend: suspendOrganization,
  close: closeOrganization,
  reactivate: reopenOrganization,
};
const DIALOGS = {
  suspend: ADMIN_LABELS.dialog.suspend,
  close: ADMIN_LABELS.dialog.closeOrganization,
  reactivate: ADMIN_LABELS.dialog.reactivate,
};
const NOTICES = { suspend: text.suspended, close: text.closed, reactivate: text.reactivated };

/** `/admin/organizations` (#23) : toutes les organisations, recherche par nom, filtre par statut, suspendre / fermer / réactiver. */
export function AdminOrganizationsPage({ organizationPath }: AdminOrganizationsPageProps) {
  const { organizations, loading, error, reload } = useOrganizations();
  const list = useAdminList(organizations, LIST);
  const resetList = list.reset;

  useEffect(() => {
    const handleDirectoryChanged = (event: Event) => {
      const { resource } = (
        event as CustomEvent<{ resource: string }>
      ).detail;

      if (resource !== 'organizations') return;

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

  const [ownerSelection, setOwnerSelection] = useState<Organization | null>(null);
  const [availableUsers, setAvailableUsers] = useState<AuthUser[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [ownerSelectionError, setOwnerSelectionError] = useState<string | null>(null);
  const [ownerSelectionLoading, setOwnerSelectionLoading] = useState(false);

  const prepareReopen = async (organization: Organization) => {
    setOwnerSelectionLoading(true);
    setOwnerSelectionError(null);
    setNotice(null);

    try {
      const memberships = await fetchMemberships(organization.organization_id);
      const hasOwner = memberships.some(
        (member) => member.status === 'ACTIVE' && member.role === 'OWNER',
      );

      if (hasOwner) {
        ask('reactivate', organization);
        return;
      }

      const users = await fetchUsers();
      const existingUserIds = new Set(memberships.map((member) => member.user_id));

      setAvailableUsers(
        users.filter(
          (user) =>
            user.account_status === 'ACTIVE' &&
            !existingUserIds.has(user.user_id),
        ),
      );
      setSelectedOwnerId('');
      setOwnerSelection(organization);
    } catch {
      setOwnerSelectionError(
        'Unable to prepare reopening. Please try again.',
      );
    } finally {
      setOwnerSelectionLoading(false);
    }
  };

  const reopenWithSelectedOwner = async () => {
    if (!ownerSelection || !selectedOwnerId) return;

    setOwnerSelectionLoading(true);
    setOwnerSelectionError(null);

    try {
      await reopenOrganizationWithOwner(
        ownerSelection.organization_id,
        selectedOwnerId,
      );

      setNotice(`${ownerSelection.title} is active again.`);
      setOwnerSelection(null);
      list.reset();
      reload();
    } catch {
      setOwnerSelectionError(
        'Unable to reopen this organization. Check the selected user and try again.',
      );
    } finally {
      setOwnerSelectionLoading(false);
    }
  };
  const ask = (kind: OrganizationModerationKind, organization: Organization) => {
    const copy = DIALOGS[kind];
    setConfirmation({
      title: copy.title,
      body: copy.body(organization.title),
      effects: copy.effects,
      confirmLabel: copy.confirm,
      confirmingLabel: copy.confirming,
      danger: kind === 'suspend',
      run: async () => {
        const updated = await REQUESTS[kind](organization.organization_id);
        list.replace(updated);
        setNotice(NOTICES[kind](updated.title));
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
            id="admin-organization-search"
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
              {ORGANIZATION_STATUS_LABELS[value]}
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

      {list.rows.length > 0 && (
      <OrganizationsTable
        organizations={list.rows}
        organizationPath={organizationPath}
        onModerate={(kind, organization) => {
          if (
            kind === 'reactivate' &&
            organization.organization_status === 'CLOSED'
          ) {
            void prepareReopen(organization);
            return;
          }

          ask(kind, organization);
        }}
      />
      )}
      {list.hidden > 0 && (
        <div className={styles.more}>
          <Button variant="secondary" onClick={list.showMore}>
            {common.more(list.nextPage)}
          </Button>
        </div>
      )}
      {ownerSelectionError && (
        <p className={styles.state} role="alert">
          {ownerSelectionError}
        </p>
      )}

      {ownerSelection && (
        <div className={styles.state}>
          <h2>Choose a new owner</h2>

          <p>
            {ownerSelection.title} has no active owner. Select an active user
            before reopening it.
          </p>

          {availableUsers.length === 0 ? (
            <p>No eligible user is available.</p>
          ) : (
            <label>
              New owner
              <select
                value={selectedOwnerId}
                onChange={(event) => setSelectedOwnerId(event.target.value)}
                disabled={ownerSelectionLoading}
              >
                <option value="">Select a user</option>
                {availableUsers.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.email}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div>
            <Button
              onClick={() => void reopenWithSelectedOwner()}
              disabled={!selectedOwnerId || ownerSelectionLoading}
            >
              Reopen organization
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                setOwnerSelection(null);
                setOwnerSelectionError(null);
              }}
              disabled={ownerSelectionLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      <ConfirmDialog
        confirmation={confirmation}
        onClose={() => setConfirmation(null)}
        cancelLabel={ADMIN_LABELS.dialog.cancel}
        closeLabel={ADMIN_LABELS.dialog.close}
        toErrorMessage={toOrganizationErrorMessage}
      />
    </section>
  );
}
