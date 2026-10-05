import { useState } from 'react';
import { Button, Dialog, type ThreadComment } from '@/shared/ui';
import { deleteOrganizationComment } from '../api/organizationsApi';
import { toCommentErrorMessage } from '../errors';
import { ORGANIZATIONS_LABELS } from '../labels';
import styles from './DeleteCommentDialog.module.css';

type DeleteCommentDialogProps = {
  /** Commentaire à supprimer ; `null` = fermé. */
  comment: ThreadComment | null;
  onClose: () => void;
  onDeleted: (commentId: string) => void;
};

const text = ORGANIZATIONS_LABELS.comments;

/** Confirmation avant `DELETE /organizations/comments/:id` : irréversible, donc jamais en un clic. */
export function DeleteCommentDialog({ comment, onClose, onDeleted }: DeleteCommentDialogProps) {
  return (
    <Dialog open={comment !== null} onClose={onClose} title={text.deleteTitle} closeLabel={text.close}>
      {comment && <Confirm comment={comment} onKeep={onClose} onDeleted={onDeleted} />}
    </Dialog>
  );
}

type ConfirmProps = { comment: ThreadComment; onKeep: () => void; onDeleted: (commentId: string) => void };

// Monté seulement quand la boîte est ouverte : l'état d'envoi repart de zéro à chaque ouverture.
function Confirm({ comment, onKeep, onDeleted }: ConfirmProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setPending(true);
    setError(null);
    try {
      await deleteOrganizationComment(comment.id);
      onDeleted(comment.id);
    } catch (failure) {
      setError(toCommentErrorMessage(failure));
      setPending(false);
    }
  };

  return (
    <div className={styles.confirm}>
      <blockquote className={styles.quote}>{comment.content}</blockquote>
      <p className={styles.body}>{text.deleteBody}</p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onKeep} disabled={pending}>
          {text.deleteKeep}
        </Button>
        <Button className={styles.danger} onClick={confirm} loading={pending} loadingLabel={text.deleting}>
          {text.deleteConfirm}
        </Button>
      </div>
    </div>
  );
}
