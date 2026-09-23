import { ButtonLink } from '@/shared/ui';
import { APP_LABELS } from '../labels';
import { ROUTES } from '../routes';
import { pageTitle } from '@/shared/lib/pageTitle';
import styles from './Page.module.css';

export function NotFoundPage() {
  const text = APP_LABELS.pages.notFound;
  return (
    <section className={styles.page}>
      <title>{pageTitle(text.title)}</title>
      <h1>{text.title}</h1>
      <p className={styles.lead}>{text.lead}</p>
      <div className={styles.actions}>
        <ButtonLink to={ROUTES.home} variant="secondary">
          {text.back}
        </ButtonLink>
      </div>
    </section>
  );
}
