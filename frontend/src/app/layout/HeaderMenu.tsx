import { useId } from 'react';
import { NavLink } from 'react-router';
import { useUnreadMessages } from '@/features/messages';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { Avatar, Icon } from '@/shared/ui';
import { APP_LABELS } from '../labels';
import styles from './HeaderMenu.module.css';

type HeaderMenuProps = {
  /** Nom du compte, pour les initiales de l'avatar. */
  name: string;
  /** Photo de profil, à la place des initiales quand il y en a une. */
  picture?: string | null;
  messagesPath: string;
  /** Espace d'administration : fourni pour les seuls admins. */
  adminPath?: string;
  onSignOut: () => void;
};

const text = APP_LABELS.accountMenu;

/**
 * Téléphone : l'avatar de l'en-tête déplie Messages, Admin (admins) et Sign out, au lieu d'aligner trois pastilles.
 * Point citron sur l'avatar et compte dans le menu quand des messages attendent. Même motif que la barre basse.
 */
export function HeaderMenu({ name, picture, messagesPath, adminPath, onSignOut }: HeaderMenuProps) {
  const { open, toggle, close, root, trigger, onKeyDown } = useDisclosure();
  const unread = useUnreadMessages();
  const menuId = useId();
  const label = unread > 0 ? text.labelUnread(unread) : text.label;

  return (
    <div ref={root} className={styles.root} onKeyDown={onKeyDown}>
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={toggle}
      >
        <Avatar name={name} src={picture} size={42} />
        {unread > 0 && <span className={styles.dot} aria-hidden="true" />}
      </button>
      {open && (
        <ul id={menuId} className={styles.menu} aria-label={text.label}>
          <li>
            <NavLink to={messagesPath} className={styles.link} onClick={close}>
              <Icon name="chat" size={18} />
              {text.messages}
              {unread > 0 && <span className={styles.count}>{unread}</span>}
            </NavLink>
          </li>
          {adminPath && (
            <li>
              <NavLink to={adminPath} className={styles.link} onClick={close}>
                <Icon name="shield" size={18} />
                {APP_LABELS.admin}
              </NavLink>
            </li>
          )}
          <li>
            <button
              type="button"
              className={[styles.link, styles.signOut].join(' ')}
              onClick={() => {
                close();
                onSignOut();
              }}
            >
              <Icon name="logout" size={18} />
              {APP_LABELS.signOut}
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
