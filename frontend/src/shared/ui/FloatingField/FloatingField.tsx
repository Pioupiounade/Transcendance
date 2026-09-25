import { useState, type ComponentPropsWithoutRef } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './FloatingField.module.css';

type FloatingFieldProps = {
  id: string;
  /** Libellé toujours visible (flottant), jamais un placeholder. */
  label: string;
  /** Message d'erreur : passe le champ en état invalide et remplace l'aide. */
  error?: string | null;
  /** Aide permanente sous le champ (ex. règle de mot de passe). */
  help?: string;
  /** Pour `type="password"` : ajoute la bascule Afficher / Masquer avec ces libellés. */
  revealLabels?: { show: string; hide: string };
  type?: 'text' | 'email' | 'password';
} & Omit<ComponentPropsWithoutRef<'input'>, 'id' | 'type' | 'placeholder' | 'className' | 'aria-invalid' | 'aria-describedby'>;

/** Champ à libellé flottant (DESIGN.md §5) : l'erreur est reliée par `aria-describedby`. */
export function FloatingField({ id, label, error, help, revealLabels, type = 'text', ...rest }: FloatingFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const toggle = type === 'password' && revealLabels ? revealLabels : null;
  const message = error || help;
  const helpId = `${id}-help`;

  return (
    <div className={[styles.field, error && styles.invalid].filter(Boolean).join(' ')}>
      <div className={styles.control}>
        <input
          id={id}
          type={toggle && revealed ? 'text' : type}
          placeholder=" "
          className={[styles.input, toggle && styles.withToggle].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? helpId : undefined}
          {...rest}
        />
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {toggle && (
          <button
            type="button"
            className={styles.toggle}
            aria-pressed={revealed}
            aria-controls={id}
            onClick={() => setRevealed((value) => !value)}
          >
            {revealed ? toggle.hide : toggle.show}
          </button>
        )}
      </div>
      {message && (
        <p id={helpId} className={[styles.help, error && styles.helpError].filter(Boolean).join(' ')}>
          {error && <Icon name="alert" size={14} strokeWidth={2.4} />}
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
