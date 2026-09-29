import type { ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './FloatingField.module.css';

export type FieldShellProps = {
  id: string;
  /** Libellé toujours visible (flottant), jamais un placeholder. */
  label: string;
  /** Message d'erreur : passe le champ en état invalide et remplace l'aide. */
  error?: string | null;
  /** Aide permanente sous le champ (ex. règle de mot de passe). */
  help?: string;
};

type Props = FieldShellProps & {
  /** Libellé maintenu en position haute (contrôle jamais vide visuellement, ex. `datetime-local`). */
  raised?: boolean;
  /** Le contrôle, qui reçoit les attributs de `fieldA11y`. */
  children: ReactNode;
  /** Élément placé dans le coin du champ (ex. bascule Afficher / Masquer). */
  corner?: ReactNode;
};

/** Habillage commun des champs flottants (DESIGN.md §5) : libellé, erreur ou aide reliée. */
export function FieldShell({ id, label, error, help, raised = false, children, corner }: Props) {
  const message = error || help;
  return (
    <div className={[styles.field, error && styles.invalid].filter(Boolean).join(' ')}>
      <div className={styles.control}>
        {children}
        <label htmlFor={id} className={[styles.label, raised && styles.raised].filter(Boolean).join(' ')}>
          {label}
        </label>
        {corner}
      </div>
      {message && (
        <p id={`${id}-help`} className={[styles.help, error && styles.helpError].filter(Boolean).join(' ')}>
          {error && <Icon name="alert" size={14} strokeWidth={2.4} />}
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
