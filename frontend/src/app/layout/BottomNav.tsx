import { NavLink } from 'react-router';
import { Icon } from '@/shared/ui';
import { APP_LABELS } from '../labels';
import { NAV_ITEMS } from './navItems';
import styles from './BottomNav.module.css';

export function BottomNav() {
  return (
    <nav className={styles.bar} aria-label={APP_LABELS.mobileNav}>
      {NAV_ITEMS.filter((item) => !item.desktopOnly).map((item) =>
        item.primary ? (
          <NavLink key={item.to} to={item.to} end={item.end} className={`${styles.item} ${styles.primary}`}>
            <span className={styles.primaryIcon}>
              <Icon name={item.icon} size={24} />
            </span>
            {item.label}
          </NavLink>
        ) : (
          <NavLink key={item.to} to={item.to} end={item.end} className={styles.item}>
            <Icon name={item.icon} size={22} />
            {item.label}
          </NavLink>
        ),
      )}
    </nav>
  );
}
