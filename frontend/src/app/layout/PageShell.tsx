import { Outlet } from 'react-router';
import { APP_LABELS } from '../labels';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
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
        <Outlet />
      </main>
      <AppFooter />
      <BottomNav />
    </div>
  );
}
