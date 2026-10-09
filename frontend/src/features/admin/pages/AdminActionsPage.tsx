import { useState } from 'react';
import {
  ACTION_STATUS,
  ACTION_STATUS_LABELS,
  approveAction,
  cancelAction,
  useActions,
  type Action,
  type ActionRecord,
} from '@/features/actions';
import { pageTitle } from '@/shared/lib/pageTitle';
import { Button, Chip, ConfirmDialog, FloatingField, Icon, type Confirmation } from '@/shared/ui';
import { ActionsTable } from '../components/ActionsTable';
import { toActionErrorMessage } from '../errors';
import { useAdminList } from '../hooks/useAdminList';
import { ADMIN_LABELS } from '../labels';
import type { ActionModerationKind } from '../types';
import styles from './AdminPage.module.css';

type AdminActionsPageProps = {
  /** Fiche publique d'une action (`/actions/:id`). */
  actionPath: (id: string) => string;
};

const text = ADMIN_LABELS.actions;
const common = ADMIN_LABELS.list;
const LIST = {
  id: (action: Action) => action.action_id,
  status: (action: Action) => action.status,
  statuses: Object.values(ACTION_STATUS),
  text: (action: Action) => action.title,
};
// « Hide » = `cancel` : l'API n'a ni rejet ni suppression, annuler est le seul moyen de retirer une action.
const REQUESTS: Record<ActionModerationKind, (id: string) => Promise<ActionRecord>> = {
  approve: approveAction,
  hide: cancelAction,
};
const DIALOGS = { approve: ADMIN_LABELS.dialog.approve, hide: ADMIN_LABELS.dialog.hide };

/** `/admin/actions` (#23) : toutes les actions, recherche par titre, filtre par statut, approuver / masquer. */
export function AdminActionsPage({ actionPath }: AdminActionsPageProps) {
  const { actions, loading, error, reload } = useActions();
  const list = useAdminList(actions, LIST);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const ask = (kind: ActionModerationKind, action: Action) => {
    const copy = DIALOGS[kind];
    setConfirmation({
      title: copy.title,
      body: copy.body(action.title),
      effects: copy.effects,
      confirmLabel: copy.confirm,
      confirmingLabel: copy.confirming,
      danger: kind === 'hide',
      run: async () => {
        // Les mutations renvoient l'action sans ses champs calculés : la ligne garde ses compteurs.
        const record = await REQUESTS[kind](action.action_id);
        list.replace({ ...action, ...record });
        setNotice(kind === 'approve' ? text.approved(action.title) : text.hidden(action.title));
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
            id="admin-action-search"
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
              {ACTION_STATUS_LABELS[value]}
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

      {list.rows.length > 0 && <ActionsTable actions={list.rows} actionPath={actionPath} onModerate={ask} />}
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
        toErrorMessage={toActionErrorMessage}
      />
    </section>
  );
}
