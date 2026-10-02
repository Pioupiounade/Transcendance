import { useLayoutEffect } from 'react';
import { Outlet } from 'react-router';

const THEME = 'admin';

/**
 * Coquille de l'espace d'administration : route parente de toutes les pages `/admin/*`. Pose le thème sombre
 * (`:root[data-theme='admin']`, styles/tokens.css) sur <html> le temps de la visite, pour que l'en-tête, le
 * fond et les boîtes modales changent ensemble ; `useLayoutEffect` évite un premier rendu clair.
 */
export function AdminLayout() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = THEME;
    return () => {
      delete root.dataset.theme;
    };
  }, []);

  return <Outlet />;
}
