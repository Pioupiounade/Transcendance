import type { ComponentPropsWithoutRef } from 'react';
import { FieldShell, type FieldShellProps } from './FieldShell';
import { fieldA11y } from './fieldA11y';
import styles from './FloatingField.module.css';

type FloatingTextareaProps = FieldShellProps &
  Omit<ComponentPropsWithoutRef<'textarea'>, 'id' | 'placeholder' | 'className' | 'aria-invalid' | 'aria-describedby'>;

/** Zone de texte à libellé flottant : même habillage que `FloatingField`, hauteur selon `rows`. */
export function FloatingTextarea({ id, label, error, help, rows = 3, ...rest }: FloatingTextareaProps) {
  return (
    <FieldShell id={id} label={label} error={error} help={help}>
      <textarea {...fieldA11y({ id, error, help, label })} rows={rows} className={[styles.input, styles.textarea].join(' ')} {...rest} />
    </FieldShell>
  );
}
