import { useId } from 'react';
import { Link, useLocation } from 'react-router';
import { AUTH_ROUTES, LoginForm } from '@/features/auth';
import { ACTIONS_LABELS } from '../labels';
import styles from './MyActionsSignIn.module.css';

const text = ACTIONS_LABELS.myActions;

/**
 * `/actions` pour un visiteur (#107) : ce que la page lui réserve, en trois pas, et le formulaire de connexion sur
 * place. Une fois connecté, `useAuth` change de statut et la page affiche la liste sans navigation.
 */
export function MyActionsSignIn() {
  const titleId = useId();
  const location = useLocation();

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{text.eyebrow}</p>
        <h1 id={titleId} className={styles.title}>
          {text.title}
        </h1>
        <p className={styles.lead}>{text.lead}</p>
        <ol className={styles.steps}>
          {text.steps.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepIndex} aria-hidden="true">
                {index + 1}
              </span>
              <span>
                <strong>{step.title}</strong> {step.body}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>{text.signInTitle}</h2>
        <LoginForm />
        <p className={styles.switch}>
          {text.noAccount}{' '}
          <Link to={AUTH_ROUTES.register} state={{ from: location }}>
            {text.register}
          </Link>
        </p>
      </div>
    </section>
  );
}
