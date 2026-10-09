import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { APP_LABELS } from '../labels';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { PaletteSwitch } from './PaletteSwitch';
import styles from './PageShell.module.css';

/** Coquille commune : en-tête, contenu routé, pied de page, barre mobile. */
export function PageShell() {
  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        {APP_LABELS.skipToContent}
      </a>
      <AppHeader />
      <main id="main" className={styles.main} tabIndex={-1}>
        {/* Pages chargées paresseusement (`app/lazyPage.ts`) : un seul Suspense pour toutes. */}
        <Suspense
          fallback={
            <p className={styles.loading} role="status">
              {APP_LABELS.pages.loading}
            </p>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <AppFooter />
      <BottomNav />
      <PaletteSwitch />
    </div>
  );
}
