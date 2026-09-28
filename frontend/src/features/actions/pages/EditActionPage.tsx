import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/features/auth';
import { pageTitle } from '@/shared/lib/pageTitle';
import { Button, ButtonLink } from '@/shared/ui';
import { useAction } from '../api/useAction';
import { useUserMemberships } from '../api/useUserMemberships';
import { ActionEditor } from '../components/ActionEditor';
import { CancelActionDialog } from '../components/CancelActionDialog';
import { ACTIONS_LABELS } from '../labels';
import { manageBlocker } from '../permissions';
import { FOCUS_PARAM } from '../mapConfig';
import type { ActionRecord } from '../types';
import styles from './ActionEditorPage.module.css';

const text = ACTIONS_LABELS.edit;
const cancelText = ACTIONS_LABELS.cancelAction;

/** `/actions/:id/edit` (protégée) : créateur ou ADMIN, action `PENDING`/`APPROVED`. Annulation = « suppression ». */
type EditActionPageProps = {
  /** Chemin de la carte, destination après enregistrement, annulation ou abandon. */
  mapPath: string;
};

export function EditActionPage({ mapPath }: EditActionPageProps) {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { action, loading, notFound, error } = useAction(id);
  const memberships = useUserMemberships(user?.user_id ?? null);
  const [cancelling, setCancelling] = useState(false);

  const blocker = action ? manageBlocker(action, user, memberships) : null;

  const onSaved = (saved: ActionRecord) =>
    navigate(`${mapPath}?${FOCUS_PARAM}=${saved.action_id}`, { state: { notice: text.saved } });
  const onCancelled = () => navigate(mapPath, { state: { notice: cancelText.done } });

  const message = notFound
    ? text.notFound
    : error
      ? text.error
      : blocker === 'notOwner' || blocker === 'anonymous'
        ? text.notAllowed
        : blocker === 'closed'
          ? text.closed
          : null;

  return (
    <section className={styles.page}>
      <title>{pageTitle(text.pageEyebrow)}</title>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>{text.pageEyebrow}</p>
        <h1>{action ? action.title : text.pageTitle}</h1>
        <p className={styles.lead}>{text.pageLead}</p>
      </header>

      {loading && (
        <p className={styles.state} role="status">
          {text.loading}
        </p>
      )}

      {message && (
        <div className={styles.state} role="alert">
          <p>{message}</p>
          <ButtonLink to={mapPath} variant="secondary">
            {text.backToMap}
          </ButtonLink>
        </div>
      )}

      {action && blocker === null && (
        <>
          <ActionEditor
            key={action.action_id}
            initialLocation={action.location}
            action={action}
            onSaved={onSaved}
            onCancel={() => navigate(mapPath)}
          />
          <div className={styles.danger}>
            <Button variant="text" onClick={() => setCancelling(true)}>
              {cancelText.button}
            </Button>
          </div>
          <CancelActionDialog
            action={cancelling ? action : null}
            onClose={() => setCancelling(false)}
            onCancelled={onCancelled}
          />
        </>
      )}
    </section>
  );
}
