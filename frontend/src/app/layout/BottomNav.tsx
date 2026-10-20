import { NavLink } from 'react-router';
import { Icon } from '@/shared/ui';
import { APP_LABELS } from '../labels';
import { NAV_ITEMS } from './navItems';
import styles from './BottomNav.module.css';

/** Barre mobile flottante (refonte) : cinq icônes dans une pilule, l'entrée courante dans un rond noir. */
export function BottomNav() {
  return (
    <nav className={styles.bar} aria-label={APP_LABELS.mobileNav}>
      {NAV_ITEMS.filter((item) => !item.desktopOnly).map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={styles.item} title={item.label}>
          <span className={styles.icon}>
            <Icon name={item.icon} size={22} />
          </span>
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
