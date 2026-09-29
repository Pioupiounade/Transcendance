import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Dialog.module.css';

type DialogProps = {
  open: boolean;
  /** Appelé pour toute fermeture : croix, Échap, clic sur le fond. Le parent passe `open` à false. */
  onClose: () => void;
  title: string;
  closeLabel: string;
  /** Monté seulement quand `open` : chaque ouverture repart d'un état neuf. */
  children: ReactNode;
};

/**
 * Boîte modale (DESIGN.md §6 « Dialog ») sur `<dialog>` natif : couche supérieure, focus piégé puis
 * rendu à l'élément déclencheur, Échap gérée par le navigateur.
 */
export function Dialog({ open, onClose, title, closeLabel, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  // Clic sur le fond : la cible est le <dialog> lui-même, jamais son contenu.
  const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <dialog ref={ref} className={styles.dialog} aria-labelledby={titleId} onClose={onClose} onClick={onBackdropClick}>
      {open && (
        <div className={styles.panel}>
          <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel}>
            <Icon name="close" size={18} strokeWidth={2.2} />
          </button>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
