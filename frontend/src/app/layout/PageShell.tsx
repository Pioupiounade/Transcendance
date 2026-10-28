import { Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { APP_LABELS } from '../labels';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import styles from './PageShell.module.css';
import { AccountSuspendedPage, useAuth } from '@/features/auth';

/** Coquille commune : en-tête, contenu routé, pied de page, barre mobile. */
export function PageShell() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <p role="status">Loading...</p>;
  }

  if (
    status === 'authenticated' &&
    user?.account_status === 'SUSPENDED'
  ) {
    if (location.pathname !== '/account-suspended') {
      return <Navigate to="/account-suspended" replace />;
    }

    return <AccountSuspendedPage />;
  }
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
    </div>
  );
}
