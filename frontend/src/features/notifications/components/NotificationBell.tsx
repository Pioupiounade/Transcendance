import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from '@/shared/ui';
import { useNotifications } from '../api/useNotifications';
import { NOTIFICATIONS_LABELS } from '../labels';
import { NotificationPanel } from './NotificationPanel';
import styles from './NotificationBell.module.css';

/** Cloche de l'en-tête et son menu. À monter seulement en session : les routes de notifications exigent le JWT. */
export function NotificationBell() {
  const { snapshot, failed, unreadCount, refresh, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const toggle = () => {
    if (!open) void refresh();
    setOpen(!open);
  };
  const readAllAndRefocus = () => {
    void markAllRead().then(() => buttonRef.current?.focus());
  };

  return (
    <div ref={rootRef} className={styles.bell}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={NOTIFICATIONS_LABELS.bell(unreadCount)}
        title={NOTIFICATIONS_LABELS.title}
        onClick={toggle}
      >
        <Icon name="bell" />
        {unreadCount > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {NOTIFICATIONS_LABELS.badge(unreadCount)}
          </span>
        )}
      </button>
      {open && (
        <NotificationPanel
          id={panelId}
          snapshot={snapshot}
          failed={failed}
          unreadCount={unreadCount}
          onRead={markRead}
          onReadAll={readAllAndRefocus}
          onNavigate={() => setOpen(false)}
        />
      )}
    </div>
  );
}
