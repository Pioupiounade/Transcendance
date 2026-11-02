import { Link, NavLink, useLocation } from 'react-router';
import { ROLE_APP, useAuth } from '@/features/auth';
import { MessagesButton } from '@/features/messages';
import { NotificationBell } from '@/features/notifications';
import { useMyProfile } from '@/features/profile';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { Avatar, Button, ButtonLink, Icon } from '@/shared/ui';
import { APP_LABELS } from '../labels';
import { ROUTES, publicProfilePath } from '../routes';
import { Brandmark } from './Brandmark';
import { HeaderMenu } from './HeaderMenu';
import { NAV_ITEMS } from './navItems';
import { GlobalSearch } from '../components/GlobalSearch';
import styles from './AppHeader.module.css';

/** Mêmes seuils que `AppHeader.module.css` : sous 1320 px la recherche prend la colonne du milieu (la nav est dans la
 * barre basse) ; sous 761 px le menu du compte remplace les pastilles de droite. */
const COMPACT_QUERY = '(max-width: 1319px)';
const PHONE_QUERY = '(max-width: 760px)';

export function AppHeader() {
  const { status, user, signOut } = useAuth();
  // La photo de profil remplace les initiales ; `null` tant que le profil n'est pas chargé ou sans photo.
  const { profile } = useMyProfile();
  const picture = profile?.profile_picture ?? null;
  const location = useLocation();
  const compact = useMediaQuery(COMPACT_QUERY);
  const phone = useMediaQuery(PHONE_QUERY);
  const links = NAV_ITEMS.filter((item) => item.to !== ROUTES.profile);
  const admin = user?.role === ROLE_APP.ADMIN;
  const search = status === 'authenticated' && (
    <div className={styles.search}>
      <GlobalSearch />
    </div>
  );

  return (
    <header className={styles.topbar}>
      <Link to={ROUTES.home} className={styles.wordmark}>
        <Brandmark />
        <span className={styles.brandName}>{APP_LABELS.brand}</span>
      </Link>

      <nav className={styles.nav} aria-label={APP_LABELS.mainNav}>
        {links.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={styles.link} title={item.label}>
            <Icon name={item.icon} />
            <span className={styles.linkLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Sous 1320 px : la recherche quitte le bloc de droite pour la colonne centrale, entourée d'air. */}
      {compact && search}

      <div className={styles.actions}>
        {!compact && search}
        {status === 'authenticated' && !phone && admin && (
          <NavLink to={ROUTES.admin} className={styles.adminLink}>
            <Icon name="shield" size={18} />
            <span className={styles.adminLabel}>{APP_LABELS.admin}</span>
          </NavLink>
        )}
        {status === 'authenticated' && !phone && <MessagesButton to={ROUTES.messages} profilePath={publicProfilePath} />}
        {status === 'authenticated' && <NotificationBell />}
        {/* Téléphone : l'avatar déplie Messages, Admin et Sign out ; ailleurs, avatar → profil et bouton texte. */}
        {status === 'authenticated' && user && phone && (
          <HeaderMenu
            name={user.email}
            picture={picture}
            messagesPath={ROUTES.messages}
            adminPath={admin ? ROUTES.admin : undefined}
            onSignOut={() => void signOut()}
          />
        )}
        {status === 'authenticated' && user && !phone && (
          <Link to={ROUTES.profile} className={styles.profileLink} aria-label={APP_LABELS.myProfile}>
            <Avatar name={user.email} src={picture} />
          </Link>
        )}
        {status === 'authenticated' && !phone && (
          <Button variant="secondary" className={styles.signOut} onClick={() => void signOut()} title={APP_LABELS.signOut}>
            {APP_LABELS.signOut}
          </Button>
        )}
        {status === 'anonymous' && (
          <ButtonLink to={ROUTES.login} state={{ from: location }} variant="secondary">
            {APP_LABELS.signIn}
          </ButtonLink>
        )}
      </div>
    </header>
  );
}
