import { useId } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
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
 * (Profile, Friends). Motif « disclosure » (useDisclosure) : Tab entre dans le menu, Échap et un tap ailleurs le referment.
 */
export function BottomNavMenu({ label, icon, items }: BottomNavMenuProps) {
  const { open, toggle, close, root, trigger, onKeyDown } = useDisclosure();
  const menuId = useId();
  const { pathname } = useLocation();
  const current = items.some((item) => isCurrent(item, pathname));

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
        onClick={toggle}
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
              <NavLink to={item.to} end={item.end} className={styles.menuLink} onClick={close}>
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
