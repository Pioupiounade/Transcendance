import { useAuth } from '@/features/auth';
import { APP_LABELS } from '../../labels';
import { Dashboard } from './Dashboard';
import { Landing } from './Landing';
import styles from '../Page.module.css';

/** `/` : accueil des visiteurs, tableau de bord du quartier une fois connecté. */
export function HomePage() {
  const { status, user } = useAuth();
  if (status === 'loading') {
    return (
      <section className={styles.page}>
        <p role="status">{APP_LABELS.pages.loading}</p>
      </section>
    );
  }
  return status === 'authenticated' && user ? <Dashboard user={user} /> : <Landing />;
}
