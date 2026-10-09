import { Link } from 'react-router';
import {
  ORGANIZATION_STATUS,
  ORGANIZATION_STATUS_LABELS,
  type Organization,
  type OrganizationStatus,
} from '@/features/organizations';
import { formatFullDate } from '@/shared/lib/formatDate';
import { Button, Icon, type IconName } from '@/shared/ui';
import { ADMIN_LABELS } from '../labels';
import type { OrganizationModerationKind } from '../types';
import table from './AdminTable.module.css';

type OrganizationsTableProps = {
  organizations: Organization[];
  /** Fiche publique d'une organisation (`/organizations/:id`) : il n'y a pas de fiche admin. */
  organizationPath: (id: string) => string;
  onModerate: (kind: OrganizationModerationKind, organization: Organization) => void;
};

const text = ADMIN_LABELS.organizations;

const STATUS_ICONS: Record<OrganizationStatus, IconName> = { ACTIVE: 'check', SUSPENDED: 'lock', CLOSED: 'close' };
const STATUS_CLASSES: Record<OrganizationStatus, string> = {
  ACTIVE: table.statusGood,
  SUSPENDED: table.statusBad,
  CLOSED: table.statusMuted,
};

/** Tableau des organisations, tous statuts. Sous 760 px chaque ligne devient une carte (AdminTable.module.css). */
export function OrganizationsTable({ organizations, organizationPath, onModerate }: OrganizationsTableProps) {
  return (
    <table className={table.table} role="table">
      <caption className={table.caption}>{text.caption}</caption>
      <thead role="rowgroup">
        <tr role="row">
          <th role="columnheader" scope="col">
            {text.columns.organization}
          </th>
          <th role="columnheader" scope="col">
            {text.columns.status}
          </th>
          <th role="columnheader" scope="col">
            {text.columns.since}
          </th>
          <th role="columnheader" scope="col" className={table.actionHead}>
            {text.columns.moderation}
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {organizations.map((organization) => (
          <tr key={organization.organization_id} role="row" className={table.row}>
            <th role="rowheader" scope="row">
              <span className={table.identity}>
                <Link to={organizationPath(organization.organization_id)} className={table.name}>
                  {organization.title}
                </Link>
                <span className={table.meta}>
                  <span>
                    <Icon name="pin" size={14} />
                    {organization.address}
                  </span>
                  <span>{text.organizationId(organization.organization_id)}</span>
                </span>
              </span>
            </th>
            <td role="cell" data-label={text.columns.status}>
              <span className={`${table.status} ${STATUS_CLASSES[organization.organization_status]}`}>
                <Icon name={STATUS_ICONS[organization.organization_status]} size={14} strokeWidth={2.4} />
                {ORGANIZATION_STATUS_LABELS[organization.organization_status]}
              </span>
            </td>
            <td role="cell" data-label={text.columns.since}>
              {formatFullDate(organization.created_at)}
            </td>
            <td role="cell" className={table.action}>
              <RowActions organization={organization} onModerate={onModerate} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type RowActionsProps = { organization: Organization; onModerate: OrganizationsTableProps['onModerate'] };

// Suspendre est la sanction (seul un admin lève une suspension) ; fermer est la fin de vie, que les gestionnaires
// peuvent aussi décider et annuler. `reactivate` sert aux deux retours à l'état actif.
function RowActions({ organization, onModerate }: RowActionsProps) {
  const { organization_status: status, title } = organization;
  if (status === ORGANIZATION_STATUS.ACTIVE) {
    return (
      <span className={table.buttons}>
        <Button
          variant="secondary"
          className={table.danger}
          aria-label={text.suspendOrganization(title)}
          onClick={() => onModerate('suspend', organization)}
        >
          {text.suspend}
        </Button>
        <Button
          variant="secondary"
          aria-label={text.closeOrganization(title)}
          onClick={() => onModerate('close', organization)}
        >
          {text.close}
        </Button>
      </span>
    );
  }
  const suspended = status === ORGANIZATION_STATUS.SUSPENDED;
  return (
    <span className={table.buttons}>
      <Button
        variant="secondary"
        aria-label={suspended ? text.reactivateOrganization(title) : text.reopenOrganization(title)}
        onClick={() => onModerate('reactivate', organization)}
      >
        {suspended ? text.reactivate : text.reopen}
      </Button>
    </span>
  );
}
