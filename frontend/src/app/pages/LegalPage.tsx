import { APP_LABELS } from '../labels';
import { pageTitle } from '@/shared/lib/pageTitle';
import styles from './Page.module.css';

type LegalPageProps = { title: string };

export function LegalPage({ title }: LegalPageProps) {
  const isTerms = title === APP_LABELS.pages.terms.title;
  const legalData = isTerms ? APP_LABELS.pages.terms : APP_LABELS.pages.privacy;

  return (
    <article className={styles.page}>
      <title>{pageTitle(title)}</title>
      <header>
        <h1>{legalData.title}</h1>
        <p className={styles.lead}>{legalData.lastUpdated}</p>
        <p style={{ marginTop: '0.75rem', lineHeight: 1.6 }}>{legalData.intro}</p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
        {legalData.sections.map((section) => (
          <article key={section.heading} style={{ lineHeight: 1.6 }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: 'inherit' }}>
              {section.heading}
            </h2>
            <p style={{ margin: 0, color: 'var(--muted, #717171)' }}>
              {section.content}
            </p>
          </article>
        ))}
      </section>
    </article>
  );
}