import { useState } from 'react';
import type { AuthUser } from '@/features/auth';
import { Button, Dialog } from '@/shared/ui';
import { blockUser, unblockUser } from '../api/adminUsersApi';
import { toAdminErrorMessage } from '../errors';
import { ADMIN_LABELS } from '../labels';
import styles from './AccountActionDialog.module.css';

export type AccountAction = { kind: 'block' | 'unblock'; user: AuthUser };

type AccountActionDialogProps = {
  /** Action à confirmer ; `null` = fermé. */
  action: AccountAction | null;
  onClose: () => void;
  /** Reçoit le compte tel que le backend le renvoie après l'action. */
  onDone: (action: AccountAction, updated: AuthUser) => void;
};

const text = ADMIN_LABELS.dialog;
const REQUESTS = { block: blockUser, unblock: unblockUser };

/** Confirmation avant de bloquer ou débloquer : le blocage coûte 50 points au compte, jamais en un clic. */
export function AccountActionDialog({ action, onClose, onDone }: AccountActionDialogProps) {
  return (
    <Dialog
      open={action !== null}
      onClose={onClose}
      title={action ? text[action.kind].title : ''}
      closeLabel={text.close}
    >
      {action && <Confirm action={action} onCancel={onClose} onDone={onDone} />}
    </Dialog>
  );
}

type ConfirmProps = { action: AccountAction; onCancel: () => void; onDone: AccountActionDialogProps['onDone'] };

// Monté seulement quand la boîte est ouverte : l'état d'envoi repart de zéro à chaque ouverture.
function Confirm({ action, onCancel, onDone }: ConfirmProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = text[action.kind];

  const confirm = async () => {
    setPending(true);
    setError(null);
    try {
      onDone(action, await REQUESTS[action.kind](action.user.user_id));
    } catch (failure) {
      setError(toAdminErrorMessage(failure));
      setPending(false);
    }
  };

  return (
    <div className={styles.confirm}>
      <p className={styles.body}>{copy.body(action.user.email)}</p>
      <ul className={styles.effects}>
        {copy.effects.map((effect) => (
          <li key={effect}>{effect}</li>
        ))}
      </ul>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          {text.cancel}
        </Button>
        <Button
          className={action.kind === 'block' ? styles.danger : undefined}
          onClick={confirm}
          loading={pending}
          loadingLabel={copy.confirming}
        >
          {copy.confirm}
        </Button>
      </div>
    </div>
  );
}
