import { useState } from 'react';
import { Button, Dialog } from '@/shared/ui';
import { useCancelAction } from '../api/useCancelAction';
import { toActionErrorMessage } from '../errors';
import { ACTIONS_LABELS } from '../labels';
import type { ActionRecord } from '../types';
import styles from './CancelActionDialog.module.css';

type CancelActionDialogProps = {
  /** Action à annuler ; `null` = fermé. */
  action: ActionRecord | null;
  onClose: () => void;
  onCancelled: (action: ActionRecord) => void;
};

const text = ACTIONS_LABELS.cancelAction;

/** Confirmation avant `PATCH /actions/:id/cancel` : irréversible, donc jamais en un clic. */
export function CancelActionDialog({ action, onClose, onCancelled }: CancelActionDialogProps) {
  return (
    <Dialog open={action !== null} onClose={onClose} title={text.title} closeLabel={text.close}>
      {action && <Confirm action={action} onKeep={onClose} onCancelled={onCancelled} />}
    </Dialog>
  );
}

type ConfirmProps = { action: ActionRecord; onKeep: () => void; onCancelled: (action: ActionRecord) => void };

// Monté seulement quand la boîte est ouverte : l'état d'envoi repart de zéro à chaque ouverture.
function Confirm({ action, onKeep, onCancelled }: ConfirmProps) {
  const cancel = useCancelAction();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setPending(true);
    setError(null);
    try {
      onCancelled(await cancel(action.action_id));
    } catch (failure) {
      setError(toActionErrorMessage(failure));
      setPending(false);
    }
  };

  return (
    <div className={styles.confirm}>
      <p className={styles.body}>{text.body}</p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onKeep} disabled={pending}>
          {text.keep}
        </Button>
        <Button className={styles.danger} onClick={confirm} loading={pending} loadingLabel={text.confirming}>
          {text.confirm}
        </Button>
      </div>
    </div>
  );
}
