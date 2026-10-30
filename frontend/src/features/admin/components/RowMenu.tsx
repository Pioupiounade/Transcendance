import { useId } from 'react';
import { Link } from 'react-router';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { Icon } from '@/shared/ui';
import styles from './RowMenu.module.css';

type Target = { to: string; onSelect?: never } | { onSelect: () => void; to?: never };

export type RowMenuItem = Target & {
  key: string;
  label: string;
  /** Geste destructif : en rouge. */
  danger?: boolean;
  /** Indisponible, et `hint` dit pourquoi sous l'entrée. */
  disabled?: boolean;
  hint?: string;
};

type RowMenuProps = {
  /** Texte du bouton (« More »). */
  text: string;
  /** Libellé accessible du bouton et du menu (« More actions for … »). */
  label: string;
  items: RowMenuItem[];
};

/**
 * Gestes secondaires d'une ligne de tableau, repliés derrière un bouton « More » : motif disclosure (Échap, tap
 * dehors, focus de retour) comme le menu du compte. Une entrée = un lien ou un bouton ; une entrée indisponible
 * reste visible avec sa raison, pour que l'admin sache quoi faire avant.
 */
export function RowMenu({ text, label, items }: RowMenuProps) {
  const { open, toggle, close, root, trigger, onKeyDown } = useDisclosure();
  const menuId = useId();

  return (
    <div ref={root} className={styles.root} onKeyDown={onKeyDown}>
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        aria-label={label}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={toggle}
      >
        {text}
        <span className={styles.caret} aria-hidden="true">
          <Icon name="chevronLeft" size={14} strokeWidth={2.4} />
        </span>
      </button>
      {open && (
        <ul id={menuId} className={styles.menu} aria-label={label}>
          {items.map((item) => (
            <li key={item.key}>
              {item.to !== undefined ? (
                <Link to={item.to} className={styles.item} onClick={close}>
                  {item.label}
                </Link>
              ) : (
                <button
                  type="button"
                  className={[styles.item, item.danger && styles.danger].filter(Boolean).join(' ')}
                  disabled={item.disabled}
                  onClick={() => {
                    close();
                    item.onSelect();
                  }}
                >
                  {item.label}
                </button>
              )}
              {item.disabled && item.hint && <p className={styles.hint}>{item.hint}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
