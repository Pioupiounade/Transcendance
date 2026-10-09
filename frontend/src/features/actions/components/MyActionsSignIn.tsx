import { useId } from 'react';
import { Link, useLocation } from 'react-router';
import { AUTH_ROUTES, LoginForm } from '@/features/auth';
import { Icon, Steps, StreetScene, type IconName } from '@/shared/ui';
import { ACTIONS_LABELS } from '../labels';
import styles from './MyActionsSignIn.module.css';

const text = ACTIONS_LABELS.myActions;
const STEP_ICONS: IconName[] = ['map', 'users', 'calendar'];
const TRUST_ICONS: IconName[] = ['users', 'lock', 'check'];

/**
 * `/actions` pour un visiteur (#107), présenté comme l'accueil : la promesse sur la rue illustrée, les trois étapes
 * sur cartes, puis la connexion sur place. Une fois connecté, `useAuth` change de statut et la page affiche la
 * liste sans navigation.
 */
export function MyActionsSignIn() {
  const titleId = useId();
  const howId = useId();
  const signInId = useId();
  const location = useLocation();

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby={titleId}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{text.eyebrow}</p>
          <h1 id={titleId} className={styles.heroTitle}>
            {text.title}
          </h1>
          <p className={styles.heroLead}>{text.lead}</p>
          <ul className={styles.trust}>
            {text.trust.map((item, index) => (
              <li key={item}>
                <Icon name={TRUST_ICONS[index]} size={15} strokeWidth={2.2} />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.heroScene}>
          <StreetScene />
        </div>
      </section>

      <section className={styles.section} aria-labelledby={howId}>
        <header className={styles.sectionHead}>
          <p className={styles.eyebrow}>{text.how.eyebrow}</p>
          <h2 id={howId}>{text.how.title}</h2>
        </header>
        <Steps steps={text.steps.map((step, index) => ({ ...step, icon: STEP_ICONS[index] }))} />
      </section>

      <section className={styles.section} aria-labelledby={signInId}>
        <header className={styles.sectionHead}>
          <p className={styles.eyebrow}>{text.signIn.eyebrow}</p>
          <h2 id={signInId}>{text.signIn.title}</h2>
          <p className={styles.sectionLead}>{text.signIn.lead}</p>
        </header>
        <div className={styles.card}>
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
        </div>
      </section>
    </div>
  );
}
