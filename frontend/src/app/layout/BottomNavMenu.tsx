import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { NavLink, useLocation } from 'react-router';
import { Icon, type IconName } from '@/shared/ui';
import type { NavItem } from './navItems';
import styles from './BottomNav.module.css';

type BottomNavMenuProps = {
  /** Nom accessible du bouton et de son menu. */
  label: string;
  icon: IconName;
  /** Entrées dépliées au-dessus de la barre, dans l'ordre. */
  items: readonly NavItem[];
};

const isCurrent = (item: NavItem, pathname: string) => (item.end ? pathname === item.to : pathname.startsWith(item.to));

/**
 * Dernière case de la barre mobile : un bouton qui déplie, au-dessus de la pilule, les entrées qui n'y tiennent pas
 * (Profile, Friends). Motif « disclosure » : Tab entre dans le menu, Échap le referme, un tap ailleurs aussi.
 */
export function BottomNavMenu({ label, icon, items }: BottomNavMenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const { pathname } = useLocation();
  const current = items.some((item) => isCurrent(item, pathname));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !open) return;
    event.preventDefault();
    setOpen(false);
    trigger.current?.focus();
  };

  return (
    <div ref={root} className={styles.menuRoot} onKeyDown={onKeyDown}>
      <button
        ref={trigger}
        type="button"
        className={[styles.item, styles.trigger].join(' ')}
        aria-expanded={open}
        aria-controls={menuId}
        data-current={current || undefined}
        title={label}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.icon}>
          <Icon name={icon} size={22} />
        </span>
        <span className={styles.label}>{label}</span>
      </button>
      {open && (
        <ul id={menuId} className={styles.menu} aria-label={label}>
          {items.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className={styles.menuLink} onClick={() => setOpen(false)}>
                <Icon name={item.icon} size={18} />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
