import { Link, NavLink } from 'react-router';
import { ROLE_APP, useAuth } from '@/features/auth';
import { Avatar, Button, ButtonLink, Icon } from '@/shared/ui';
import { APP_LABELS } from '../labels';
import { ROUTES } from '../routes';
import { Brandmark } from './Brandmark';
import { NAV_ITEMS } from './navItems';
import styles from './AppHeader.module.css';

export function AppHeader() {
  const { status, user, signOut } = useAuth();
  const links = NAV_ITEMS.filter((item) => item.to !== ROUTES.profile);

  return (
    <header className={styles.topbar}>
      <Link to={ROUTES.home} className={styles.wordmark}>
        <Brandmark />
        {APP_LABELS.brand}
      </Link>

      <nav className={styles.nav} aria-label={APP_LABELS.mainNav}>
        {links.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={styles.link} title={item.label}>
            <Icon name={item.icon} />
            <span className={styles.linkLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.actions}>
        {user?.role === ROLE_APP.ADMIN && (
          <NavLink to={ROUTES.admin} className={styles.adminLink}>
            <Icon name="shield" size={18} />
            <span className={styles.adminLabel}>{APP_LABELS.admin}</span>
          </NavLink>
        )}
        {status === 'authenticated' && user && (
          <Link to={ROUTES.profile} className={styles.profileLink} aria-label={APP_LABELS.myProfile}>
            <Avatar name={user.email} />
          </Link>
        )}
        {status === 'authenticated' && (
          <Button variant="secondary" onClick={() => void signOut()}>
            {APP_LABELS.signOut}
          </Button>
        )}
        {status === 'anonymous' && (
          <ButtonLink to={ROUTES.login} variant="secondary">
            {APP_LABELS.signIn}
          </ButtonLink>
        )}
      </div>
    </header>
  );
}
