import { APP_LABELS } from '../labels';
import { pageTitle } from './pageTitle';
import styles from './Page.module.css';

type PlaceholderPageProps = { title: string };

/** Écran non encore construit : remplacé par la page de sa feature au ticket correspondant. */
export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className={styles.page}>
      <title>{pageTitle(title)}</title>
      <h1>{title}</h1>
      <p className={styles.lead}>{APP_LABELS.pages.placeholder}</p>
    </section>
  );
}
