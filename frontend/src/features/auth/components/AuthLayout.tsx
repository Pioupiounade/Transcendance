import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { pageTitle } from '@/shared/lib/pageTitle';
import { Icon } from '@/shared/ui';
import { AUTH_LABELS } from '../labels';
import { AuthBackdrop } from './AuthBackdrop';
import { AuthHero } from './AuthHero';
import styles from './AuthLayout.module.css';

type AuthLayoutProps = {
  /** Titre d'onglet court (« Sign in »), distinct de l'accroche. */
  pageName: string;
  title: string;
  lead: string;
  /** Phrase de réassurance sous le formulaire. */
  reassure: string;
  switchText: string;
  switchLink: string;
  switchTo: string;
  children: ReactNode;
};

/** Hero + carte centrée (DESIGN.md §6 « Auth card ») ; le formulaire est passé en enfant. */
export function AuthLayout({
  pageName,
  title,
  lead,
  reassure,
  switchText,
  switchLink,
  switchTo,
  children,
}: AuthLayoutProps) {
  return (
    <div className={styles.page}>
      <title>{pageTitle(pageName)}</title>
      <div className={styles.hero}>
        <AuthHero />
      </div>
      <div className={styles.backdrop}>
        <AuthBackdrop />
      </div>
      <section className={styles.card} aria-labelledby="auth-title">
        <h1 id="auth-title" className={styles.title}>
          {title}
        </h1>
        <p className={styles.lead}>{lead}</p>
        {children}
        <div className={styles.reassure}>
          <Icon name="lock" size={18} />
          <p>
            <strong>{AUTH_LABELS.reassureTitle}</strong> {reassure}
          </p>
        </div>
        <p className={styles.switchLine}>
          {switchText} <Link to={switchTo}>{switchLink}</Link>
        </p>
      </section>
    </div>
  );
}
