import { useId, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import { Icon } from '@/shared/ui';
import { toSendErrorMessage, validateMessage } from '../errors';
import { MESSAGES_LABELS } from '../labels';
import { MESSAGE_MAX_LENGTH } from '../types';
import styles from './MessageComposer.module.css';

type MessageComposerProps = {
  /** Envoi du contenu (déjà `trim`) ; une exception est traduite et affichée sous le champ. */
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
};

const COUNTER_FROM = 200;
const FIELD_MAX_HEIGHT = 120;
const text = MESSAGES_LABELS.composer;

/** Entrée envoie, Maj+Entrée saute une ligne ; le champ grandit avec le texte et se vide après l'envoi. */
export function MessageComposer({ onSend, disabled = false }: MessageComposerProps) {
  const id = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const content = value.trim();
  const over = content.length > MESSAGE_MAX_LENGTH;
  const canSend = content.length > 0 && !over && !sending && !disabled;

  const fit = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, FIELD_MAX_HEIGHT)}px`;
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
    setError(null);
    fit(event.target);
  };

  const submit = async () => {
    const problem = validateMessage(content);
    if (problem !== null) {
      setError(problem);
      return;
    }
    if (!canSend) return;
    setSending(true);
    try {
      await onSend(content);
      setValue('');
      if (field.current) {
        field.current.style.height = 'auto';
        field.current.focus();
      }
    } catch (cause) {
      setError(toSendErrorMessage(cause));
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void submit();
  };

  const errorId = `${id}-error`;
  return (
    <form className={styles.composer} onSubmit={handleSubmit}>
      <textarea
        ref={field}
        id={id}
        className={styles.field}
        rows={1}
        value={value}
        placeholder={text.placeholder}
        aria-label={text.label}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <button type="submit" className={styles.send} disabled={!canSend} aria-label={text.send} title={text.send}>
        <Icon name="send" size={18} />
      </button>
      <div className={styles.meta}>
        {error && (
          <p id={errorId} className={styles.error} role="alert">
            {error}
          </p>
        )}
        {content.length >= COUNTER_FROM && (
          <span className={styles.counter} data-over={over || undefined}>
            {text.counter(content.length, MESSAGE_MAX_LENGTH)}
          </span>
        )}
      </div>
    </form>
  );
}
