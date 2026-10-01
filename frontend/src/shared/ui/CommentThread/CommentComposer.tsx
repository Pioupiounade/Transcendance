import { useId, useState, type FormEvent } from 'react';
import { Button } from '../Button/Button';
import { FloatingTextarea } from '../FloatingField/FloatingTextarea';
import styles from './CommentThread.module.css';

type CommentComposerProps = {
  /** Libellé flottant de la zone de texte. */
  label: string;
  maxLength: number;
  submitLabel: string;
  submittingLabel: string;
  /** Règle du contenu, appliquée à l'envoi : message d'erreur ou `null`. */
  validate: (value: string) => string | null;
  /** Envoi du contenu (déjà `trim`). Une exception est traduite par `describeError` et affichée sous le champ. */
  onSubmit: (content: string) => Promise<void>;
  describeError: (error: unknown) => string;
};

/** Formulaire d'un commentaire : zone de texte avec compteur, bouton, erreur reliée au champ. Vidé après l'envoi. */
export function CommentComposer({
  label,
  maxLength,
  submitLabel,
  submittingLabel,
  validate,
  onSubmit,
  describeError,
}: CommentComposerProps) {
  const id = useId();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const message = validate(value);
    if (message !== null) {
      setError(message);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(value.trim());
      setValue('');
      setError(null);
    } catch (cause: unknown) {
      setError(describeError(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.composer} onSubmit={handleSubmit} noValidate>
      <FloatingTextarea
        id={id}
        label={label}
        rows={3}
        maxLength={maxLength}
        value={value}
        error={error}
        help={`${value.length}/${maxLength}`}
        disabled={submitting}
        onChange={(event) => {
          setValue(event.target.value);
          setError(null);
        }}
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}
