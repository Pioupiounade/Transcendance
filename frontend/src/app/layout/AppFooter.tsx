import { Link } from 'react-router';
import { APP_LABELS } from '../labels';
import { ROUTES } from '../routes';
import styles from './AppFooter.module.css';

export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>
          <span className={styles.brand}>{APP_LABELS.brand}</span> · {APP_LABELS.tagline}
        </span>
        <nav className={styles.links} aria-label={APP_LABELS.footerNav}>
          <Link to={ROUTES.terms}>{APP_LABELS.pages.terms.title}</Link>
          <Link to={ROUTES.privacy}>{APP_LABELS.pages.privacy.title}</Link>
        </nav>
      </div>
    </footer>
  );
}
