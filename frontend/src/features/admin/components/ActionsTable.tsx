import { Link } from 'react-router';
import {
  ACTION_STATUS,
  ACTION_STATUS_LABELS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  type Action,
  type ActionStatus,
} from '@/features/actions';
import { formatDateTime, formatFullDate } from '@/shared/lib/formatDate';
import { Button, Icon, type IconName } from '@/shared/ui';
import { ADMIN_LABELS } from '../labels';
import type { ActionModerationKind } from '../types';
import table from './AdminTable.module.css';

type ActionsTableProps = {
  actions: Action[];
  /** Fiche publique d'une action (`/actions/:id`) : il n'y a pas de fiche admin. */
  actionPath: (id: string) => string;
  onModerate: (kind: ActionModerationKind, action: Action) => void;
};

const text = ADMIN_LABELS.actions;

const STATUS_ICONS: Record<ActionStatus, IconName> = {
  PENDING: 'clock',
  APPROVED: 'check',
  COMPLETED: 'flag',
  CANCELLED: 'close',
  REJECTED: 'close',
};
const STATUS_CLASSES: Record<ActionStatus, string> = {
  PENDING: table.statusWait,
  APPROVED: table.statusGood,
  COMPLETED: table.statusMuted,
  CANCELLED: table.statusBad,
  REJECTED: table.statusBad,
};

// Le backend refuse d'approuver tant que `min_participants` voisins (3 par défaut) ne sont pas inscrits :
// autant le dire à la place du bouton plutôt qu'après le clic.
const DEFAULT_MIN_PARTICIPANTS = 3;
const required = (action: Action) => action.min_participants ?? DEFAULT_MIN_PARTICIPANTS;

/** Tableau des actions, tous statuts. Sous 760 px chaque ligne devient une carte (AdminTable.module.css). */
export function ActionsTable({ actions, actionPath, onModerate }: ActionsTableProps) {
  return (
    <table className={table.table} role="table">
      <caption className={table.caption}>{text.caption}</caption>
      <thead role="rowgroup">
        <tr role="row">
          <th role="columnheader" scope="col">
            {text.columns.action}
          </th>
          <th role="columnheader" scope="col">
            {text.columns.status}
          </th>
          <th role="columnheader" scope="col">
            {text.columns.when}
          </th>
          <th role="columnheader" scope="col" className={table.number}>
            {text.columns.participants}
          </th>
          <th role="columnheader" scope="col">
            {text.columns.submitted}
          </th>
          <th role="columnheader" scope="col" className={table.actionHead}>
            {text.columns.moderation}
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {actions.map((action) => (
          <tr key={action.action_id} role="row" className={table.row}>
            <th role="rowheader" scope="row">
              <span className={table.identity}>
                <Link to={actionPath(action.action_id)} className={table.name}>
                  {action.title}
                </Link>
                <span className={table.meta}>
                  <span>
                    <Icon name={CATEGORY_ICONS[action.category]} size={14} />
                    {CATEGORY_LABELS[action.category]}
                  </span>
                  <span>{text.actionId(action.action_id)}</span>
                </span>
              </span>
            </th>
            <td role="cell" data-label={text.columns.status}>
              <span className={`${table.status} ${STATUS_CLASSES[action.status]}`}>
                <Icon name={STATUS_ICONS[action.status]} size={14} strokeWidth={2.4} />
                {ACTION_STATUS_LABELS[action.status]}
              </span>
            </td>
            <td role="cell" data-label={text.columns.when}>
              {formatDateTime(action.scheduled_at)}
            </td>
            <td role="cell" data-label={text.columns.participants} className={table.number}>
              {text.participants(action.participant_count, action.max_participants)}
            </td>
            <td role="cell" data-label={text.columns.submitted}>
              {formatFullDate(action.created_at)}
            </td>
            <td role="cell" className={table.action}>
              <RowActions action={action} onModerate={onModerate} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type RowActionsProps = { action: Action; onModerate: ActionsTableProps['onModerate'] };

function RowActions({ action, onModerate }: RowActionsProps) {
  const open = action.status === ACTION_STATUS.PENDING || action.status === ACTION_STATUS.APPROVED;
  if (!open) return <span className={table.none}>{text.nothing}</span>;
  const pending = action.status === ACTION_STATUS.PENDING;
  const ready = action.participant_count >= required(action);
  return (
    <span className={table.buttons}>
      {pending && !ready && (
        <span className={table.none}>{text.needs(action.participant_count, required(action))}</span>
      )}
      {pending && ready && (
        <Button
          variant="secondary"
          aria-label={text.approveAction(action.title)}
          onClick={() => onModerate('approve', action)}
        >
          {text.approve}
        </Button>
      )}
      <Button
        variant="secondary"
        className={table.danger}
        aria-label={text.hideAction(action.title)}
        onClick={() => onModerate('hide', action)}
      >
        {text.hide}
      </Button>
    </span>
  );
}
