import { APP_LABELS } from '../labels';
import { pageTitle } from './pageTitle';
import styles from './Page.module.css';

/** Placeholder : la vraie page vivra dans features/auth (ticket suivant). */
export function LoginPage() {
  const text = APP_LABELS.pages.login;
  return (
    <section className={styles.page}>
      <title>{pageTitle(text.title)}</title>
      <h1>{text.title}</h1>
      <p className={styles.lead}>{text.soon}</p>
    </section>
  );
}
