import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Checkbox.module.css';

type CheckboxProps = {
  id: string;
  /** Libellé riche (texte, liens), toujours visible. */
  children: ReactNode;
  error?: string | null;
} & Omit<ComponentPropsWithoutRef<'input'>, 'id' | 'type' | 'className' | 'children' | 'aria-invalid' | 'aria-describedby'>;

/** Case à cocher avec libellé riche (DESIGN.md §5 « Consent checkbox ») et erreur reliée. */
export function Checkbox({ id, children, error, ...rest }: CheckboxProps) {
  const helpId = `${id}-help`;
  return (
    <div className={[styles.wrap, error && styles.invalid].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={styles.consent}>
        <input
          id={id}
          type="checkbox"
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? helpId : undefined}
          {...rest}
        />
        <span>{children}</span>
      </label>
      {error && (
        <p id={helpId} className={styles.help}>
          <Icon name="alert" size={14} strokeWidth={2.4} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
