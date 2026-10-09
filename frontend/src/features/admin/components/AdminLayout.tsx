import { useLayoutEffect } from 'react';
import { NavLink, Outlet } from 'react-router';
import { Icon } from '@/shared/ui';
import { ADMIN_LABELS } from '../labels';
import styles from './AdminLayout.module.css';

const THEME = 'admin';
const text = ADMIN_LABELS.nav;

type AdminLayoutProps = {
  /** Chemins des trois sections (`/admin/users`…) : la feature n'importe pas `app/`. */
  usersPath: string;
  actionsPath: string;
  organizationsPath: string;
};

/**
 * Coquille de l'espace d'administration : route parente de toutes les pages `/admin/*`. Pose le thème sombre
 * (`:root[data-theme='admin']`, styles/tokens.css) sur <html> le temps de la visite, pour que l'en-tête, le
 * fond et les boîtes modales changent ensemble ; `useLayoutEffect` évite un premier rendu clair.
 * Au-dessus des pages, une barre d'onglets faite de liens : une URL par section (rechargement, retour arrière et
 * lien direct fonctionnent), l'onglet courant vient de l'`aria-current` posé par NavLink.
 */
export function AdminLayout({ usersPath, actionsPath, organizationsPath }: AdminLayoutProps) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = THEME;
    return () => {
      delete root.dataset.theme;
    };
  }, []);

  const sections = [
    { to: usersPath, label: text.users },
    { to: actionsPath, label: text.actions },
    { to: organizationsPath, label: text.organizations },
  ];

  return (
    <>
      <nav className={styles.bar} aria-label={text.label}>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>
            <Icon name="shield" size={16} strokeWidth={2.2} />
            <span className={styles.eyebrowLabel}>{text.eyebrow}</span>
          </p>
          <ul className={styles.tabs}>
            {sections.map((section) => (
              <li key={section.to}>
                <NavLink to={section.to} className={styles.tab}>
                  {section.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <Outlet />
    </>
  );
}
