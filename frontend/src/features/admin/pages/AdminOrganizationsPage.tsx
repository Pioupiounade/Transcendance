import { useState } from 'react';
import {
  ORGANIZATION_STATUS,
  ORGANIZATION_STATUS_LABELS,
  closeOrganization,
  reopenOrganization,
  suspendOrganization,
  useOrganizations,
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
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
        <OrganizationsTable organizations={list.rows} organizationPath={organizationPath} onModerate={ask} />
      )}
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
        toErrorMessage={toOrganizationErrorMessage}
      />
    </section>
  );
}
