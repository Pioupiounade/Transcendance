import { useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { Icon } from '@/shared/ui';
import { useUnreadMessages } from '../api/useUnreadMessages';
import { MESSAGES_LABELS } from '../labels';
import { MessagesDock } from './MessagesDock';
import styles from './MessagesButton.module.css';

type MessagesButtonProps = {
  /** Chemin de la page des messages (`/messages`). */
  to: string;
  profilePath: (userId: string) => string;
};

/** Même seuil que `MessagesButton.module.css` : au-dessus, bulle flottante et volet ; en dessous, pastille → page. */
const DESKTOP_QUERY = '(min-width: 761px)';

/**
 * Entrée discrète de la messagerie. Sur téléphone : pastille de l'en-tête qui mène à la page. Dès 761 px : bulle
 * flottante en bas à droite qui ouvre le volet de discussion sur place (façon Messenger) ; absente sur la page.
 */
export function MessagesButton({ to, profilePath }: MessagesButtonProps) {
  const unread = useUnreadMessages();
  const { pathname } = useLocation();
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const [wantOpen, setWantOpen] = useState(false);
  const bubble = useRef<HTMLButtonElement>(null);
  const dockId = useId();

  const active = pathname === to || pathname.startsWith(`${to}/`);
  const label = unread > 0 ? MESSAGES_LABELS.entryUnread(unread) : MESSAGES_LABELS.entry;
  const dot = unread > 0 && <span className={styles.dot} aria-hidden="true" />;

  if (!desktop) {
    return (
      <Link to={to} className={styles.button} aria-label={label} title={label} aria-current={active ? 'page' : undefined}>
        <Icon name="chat" size={20} />
        {dot}
      </Link>
    );
  }

  // Sur la page des messages, ni bulle ni volet : on y est.
  if (active) return null;

  const open = wantOpen;
  const close = () => {
    setWantOpen(false);
    bubble.current?.focus();
  };
  return (
    <>
      <button
        ref={bubble}
        type="button"
        className={styles.button}
        aria-label={open ? MESSAGES_LABELS.dock.close : label}
        title={open ? MESSAGES_LABELS.dock.close : label}
        aria-expanded={open}
        aria-controls={open ? dockId : undefined}
        onClick={() => setWantOpen((value) => !value)}
      >
        <Icon name={open ? 'close' : 'chat'} size={20} />
        {!open && dot}
      </button>
      {open && <MessagesDock id={dockId} fullPagePath={to} profilePath={profilePath} onClose={close} />}
    </>
  );
}
