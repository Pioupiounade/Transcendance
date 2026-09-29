import { useState, type ComponentPropsWithoutRef } from 'react';
import { FieldShell, type FieldShellProps } from './FieldShell';
import { fieldA11y } from './fieldA11y';
import styles from './FloatingField.module.css';

type FloatingFieldProps = FieldShellProps & {
  /** Pour `type="password"` : ajoute la bascule Afficher / Masquer avec ces libellés. */
  revealLabels?: { show: string; hide: string };
  type?: 'text' | 'email' | 'password' | 'number' | 'datetime-local';
} & Omit<ComponentPropsWithoutRef<'input'>, 'id' | 'type' | 'placeholder' | 'className' | 'aria-invalid' | 'aria-describedby'>;

/** Types d'`input` qui affichent toujours quelque chose : `:placeholder-shown` ne s'applique pas. */
const ALWAYS_FILLED = new Set(['datetime-local']);

/** Champ à libellé flottant (DESIGN.md §5) : l'erreur est reliée par `aria-describedby`. */
export function FloatingField({ id, label, error, help, revealLabels, type = 'text', ...rest }: FloatingFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const toggle = type === 'password' && revealLabels ? revealLabels : null;

  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      help={help}
      raised={ALWAYS_FILLED.has(type)}
      corner={
        toggle && (
          <button
            type="button"
            className={styles.toggle}
            aria-pressed={revealed}
            aria-controls={id}
            onClick={() => setRevealed((value) => !value)}
          >
            {revealed ? toggle.hide : toggle.show}
          </button>
        )
      }
    >
      <input
        {...fieldA11y({ id, error, help, label })}
        type={toggle && revealed ? 'text' : type}
        className={[styles.input, toggle && styles.withToggle].filter(Boolean).join(' ')}
        {...rest}
      />
    </FieldShell>
  );
}
