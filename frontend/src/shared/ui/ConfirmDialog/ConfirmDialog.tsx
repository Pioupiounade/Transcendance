import { useState } from 'react';
import { Button } from '../Button/Button';
import { Dialog } from '../Dialog/Dialog';
import styles from './ConfirmDialog.module.css';

/** Ce qu'il faut confirmer : textes et action. Un objet par ouverture (l'appelant le construit au clic). */
export type Confirmation = {
  title: string;
  body: string;
  /** Conséquences à connaître avant de confirmer, en liste. */
  effects?: readonly string[];
  confirmLabel: string;
  confirmingLabel: string;
  /** Action destructive : bouton de confirmation rouge. */
  danger?: boolean;
  /** L'action. Une exception laisse la boîte ouverte et s'affiche via `toErrorMessage`. */
  run: () => Promise<void>;
};

type ConfirmDialogProps = {
  /** `null` = fermé. */
  confirmation: Confirmation | null;
  /** Appelé à l'annulation et après une action réussie. */
  onClose: () => void;
  cancelLabel: string;
  closeLabel: string;
  toErrorMessage: (error: unknown) => string;
};

/** Confirmation avant une action irréversible ou coûteuse : jamais en un clic (DESIGN.md §6 « Dialog »). */
export function ConfirmDialog({ confirmation, onClose, cancelLabel, closeLabel, toErrorMessage }: ConfirmDialogProps) {
  return (
    <Dialog open={confirmation !== null} onClose={onClose} title={confirmation?.title ?? ''} closeLabel={closeLabel}>
      {confirmation && (
        <Confirm confirmation={confirmation} onClose={onClose} cancelLabel={cancelLabel} toErrorMessage={toErrorMessage} />
      )}
    </Dialog>
  );
}

type ConfirmProps = Pick<ConfirmDialogProps, 'onClose' | 'cancelLabel' | 'toErrorMessage'> & { confirmation: Confirmation };

// Monté seulement quand la boîte est ouverte : l'état d'envoi repart de zéro à chaque ouverture.
function Confirm({ confirmation, onClose, cancelLabel, toErrorMessage }: ConfirmProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setPending(true);
    setError(null);
    try {
      await confirmation.run();
      onClose();
    } catch (failure) {
      setError(toErrorMessage(failure));
      setPending(false);
    }
  };

  return (
    <div className={styles.confirm}>
      <p className={styles.body}>{confirmation.body}</p>
      {confirmation.effects && confirmation.effects.length > 0 && (
        <ul className={styles.effects}>
          {confirmation.effects.map((effect) => (
            <li key={effect}>{effect}</li>
          ))}
        </ul>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          {cancelLabel}
        </Button>
        <Button
          className={confirmation.danger ? styles.danger : undefined}
          onClick={confirm}
          loading={pending}
          loadingLabel={confirmation.confirmingLabel}
        >
          {confirmation.confirmLabel}
        </Button>
      </div>
    </div>
  );
}
