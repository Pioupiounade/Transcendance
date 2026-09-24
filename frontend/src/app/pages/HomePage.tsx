import { ButtonLink } from '@/shared/ui';
import { APP_LABELS } from '../labels';
import { ROUTES } from '../routes';
import { pageTitle } from '@/shared/lib/pageTitle';
import styles from './Page.module.css';

const text = APP_LABELS.pages.home;

export function HomePage() {
  return (
    <section className={styles.page}>
      <title>{pageTitle(APP_LABELS.nav.home)}</title>
      <p className={styles.eyebrow}>{text.eyebrow}</p>
      <h1>{text.title}</h1>
      <p className={styles.lead}>{text.lead}</p>
      <div className={styles.actions}>
        <ButtonLink to={ROUTES.actions} size="lg">
          {text.ctaActions}
        </ButtonLink>
        <ButtonLink to={ROUTES.register} variant="secondary" size="lg">
          {text.ctaJoin}
        </ButtonLink>
      </div>
    </section>
  );
}
