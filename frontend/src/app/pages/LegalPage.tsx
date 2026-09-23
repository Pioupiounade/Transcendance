import { APP_LABELS } from '../labels';
import { pageTitle } from '@/shared/lib/pageTitle';
import styles from './Page.module.css';

type LegalPageProps = { title: string };

/** CGU et confidentialité (exigées par le sujet). Contenu réel : ticket dédié. */
export function LegalPage({ title }: LegalPageProps) {
  return (
    <article className={styles.page}>
      <title>{pageTitle(title)}</title>
      <h1>{title}</h1>
      <p className={styles.lead}>{APP_LABELS.pages.legalPlaceholder}</p>
    </article>
  );
}
