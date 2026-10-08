import { useId } from 'react';
import { Link, useLocation } from 'react-router';
import { AUTH_ROUTES, LoginForm } from '@/features/auth';
import { Icon, Steps, type IconName } from '@/shared/ui';
import { ACTIONS_LABELS } from '../labels';
import styles from './MyActionsSignIn.module.css';

const text = ACTIONS_LABELS.myActions;
const STEP_ICONS: IconName[] = ['map', 'users', 'calendar'];
const TRUST_ICONS: IconName[] = ['users', 'lock', 'check'];

/**
 * `/actions` pour un visiteur (#107) : la promesse de la page comme sur l'accueil (trois étapes sur cartes, gages
 * de confiance) et la connexion sur place, à droite. Une fois connecté, `useAuth` change de statut et la page
 * affiche la liste sans navigation.
 */
export function MyActionsSignIn() {
  const titleId = useId();
  const signInId = useId();
  const location = useLocation();

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{text.eyebrow}</p>
        <h1 id={titleId} className={styles.title}>
          {text.title}
        </h1>
        <p className={styles.lead}>{text.lead}</p>
        <Steps layout="list" steps={text.steps.map((step, index) => ({ ...step, icon: STEP_ICONS[index] }))} />
        <ul className={styles.trust}>
          {text.trust.map((item, index) => (
            <li key={item}>
              <Icon name={TRUST_ICONS[index]} size={15} strokeWidth={2.2} />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <aside className={styles.card} aria-labelledby={signInId}>
        <h2 id={signInId} className={styles.cardTitle}>
          {text.signInTitle}
        </h2>
        <p className={styles.cardLead}>{text.signInLead}</p>
        <LoginForm />
        <p className={styles.reassure}>
          <Icon name="lock" size={16} strokeWidth={2.2} />
          {text.reassure}
        </p>
        <p className={styles.switch}>
          {text.noAccount}{' '}
          <Link to={AUTH_ROUTES.register} state={{ from: location }}>
            {text.register}
          </Link>
        </p>
      </aside>
    </section>
  );
}
