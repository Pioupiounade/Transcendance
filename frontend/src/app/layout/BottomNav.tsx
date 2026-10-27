import { NavLink } from 'react-router';
import { Icon } from '@/shared/ui';
import { APP_LABELS } from '../labels';
import { ROUTES } from '../routes';
import { BottomNavMenu } from './BottomNavMenu';
import { NAV_ITEMS } from './navItems';
import styles from './BottomNav.module.css';

// Quatre liens directs, puis la case « Profile » qui déplie Profile et Friends (la pilule garde cinq cases).
const LINKS = NAV_ITEMS.filter((item) => !item.desktopOnly && item.to !== ROUTES.profile);
const MENU_ITEMS = [ROUTES.profile, ROUTES.friends].flatMap((to) => NAV_ITEMS.filter((item) => item.to === to));

/** Barre mobile flottante (refonte) : cinq cases dans une pilule, l'entrée courante dans un rond noir. */
export function BottomNav() {
  return (
    <nav className={styles.bar} aria-label={APP_LABELS.mobileNav}>
      {LINKS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={styles.item} title={item.label}>
          <span className={styles.icon}>
            <Icon name={item.icon} size={22} />
          </span>
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
      <BottomNavMenu label={APP_LABELS.nav.profileMenu} icon="user" items={MENU_ITEMS} />
    </nav>
  );
}
