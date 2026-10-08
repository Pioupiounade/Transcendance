import { Icon } from '../Icon/Icon';
import type { IconName } from '../Icon/icons';
import styles from './Steps.module.css';

export type Step = { icon: IconName; title: string; body: string };

type StepsProps = {
  steps: readonly Step[];
  /** `grid` : une carte par colonne (landing « How it works ») ; `list` : cartes empilées, icône à gauche. */
  layout?: 'grid' | 'list';
  className?: string;
};

/** Étapes numérotées sur cartes teintées (maquette « How it works ») : la promesse en trois temps. */
export function Steps({ steps, layout = 'grid', className }: StepsProps) {
  return (
    <ol className={[styles.steps, styles[layout], className].filter(Boolean).join(' ')}>
      {steps.map((step, index) => (
        <li key={step.title} className={styles.step}>
          <span className={styles.icon}>
            <Icon name={step.icon} size={22} />
          </span>
          <span className={styles.number}>{index + 1}</span>
          <h3 className={styles.title}>{step.title}</h3>
          <p className={styles.body}>{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
