import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ActionCard,
  CATEGORY,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  FOCUS_PARAM,
  NeighborhoodMap,
  OPEN_STATUSES,
  useActions,
} from '@/features/actions';
import { pageTitle } from '@/shared/lib/pageTitle';
import { Button, ButtonLink, Icon, Steps, type IconName } from '@/shared/ui';
import quartier from '@/assets/quartier.jpg';
import { APP_LABELS } from '../../labels';
import { ROUTES } from '../../routes';
import styles from './Landing.module.css';

const text = APP_LABELS.pages.landing;
const STEP_ICONS: IconName[] = ['map', 'plus', 'users'];
const TRUST_ICONS: IconName[] = ['users', 'lock', 'check'];
const UPCOMING_LIMIT = 3;

/** Accueil des visiteurs (refonte) : la promesse sur fond clair, comment ça marche, la carte vivante, puis l'inscription. */
export function Landing() {
  const navigate = useNavigate();
  const { actions, loading, error, reload } = useActions();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const open = useMemo(() => actions.filter((action) => OPEN_STATUSES.includes(action.status)), [actions]);
  const upcoming = useMemo(
    () => [...open].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)).slice(0, UPCOMING_LIMIT),
    [open],
  );

  const openOnMap = (id: string) => {
    setSelectedId(id);
    navigate(`${ROUTES.map}?${FOCUS_PARAM}=${id}`);
  };

  return (
    <div className={styles.landing}>
      <title>{pageTitle(APP_LABELS.nav.home)}</title>

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{text.eyebrow}</p>
          <h1 id="hero-title" className={styles.heroTitle}>
            {text.title}
          </h1>
          <p className={styles.heroLead}>{text.lead}</p>
          <div className={styles.heroActions}>
            <ButtonLink to={ROUTES.register} size="lg">
              {text.ctaJoin}
            </ButtonLink>
            <ButtonLink to={ROUTES.map} variant="secondary" size="lg">
              {text.ctaExplore}
            </ButtonLink>
          </div>
          <ul className={styles.trust}>
            {text.trust.map((item, index) => (
              <li key={item}>
                <Icon name={TRUST_ICONS[index]} size={15} strokeWidth={2.2} />
                {item}
              </li>
            ))}
          </ul>
        </div>
        {/* Photo de quartier (refonte) : la « carte photo » du brief, décorative, avec un cartouche vers la carte. */}
        <figure className={styles.heroPhoto}>
          <img src={quartier} alt="" width={1800} height={1201} />
          {open.length > 0 && (
            <span className={styles.heroBadge}>
              <span className={styles.heroDot} aria-hidden="true" />
              {text.photo.badge(open.length)}
            </span>
          )}
          <figcaption className={styles.heroCaption}>
            <span>
              <small>{text.photo.kicker}</small>
              <strong>{text.photo.title}</strong>
            </span>
            <Link to={ROUTES.map} className={styles.heroGo} aria-label={text.photo.cta} title={text.photo.cta}>
              <Icon name="arrow" size={18} strokeWidth={2.2} />
            </Link>
          </figcaption>
        </figure>
      </section>

      <section className={styles.section} aria-labelledby="how-title">
        <header className={[styles.sectionHead, styles.centered].join(' ')}>
          <p className={styles.eyebrow}>{text.how.eyebrow}</p>
          <h2 id="how-title">{text.how.title}</h2>
        </header>
        <Steps steps={text.how.steps.map((step, index) => ({ ...step, icon: STEP_ICONS[index] }))} />
      </section>

      <section className={[styles.section, styles.live].join(' ')} aria-labelledby="live-title">
        <header className={styles.sectionHead}>
          <p className={styles.eyebrow}>{text.live.eyebrow}</p>
          <h2 id="live-title">{text.live.title}</h2>
          <p className={styles.sectionLead}>{text.live.lead}</p>
        </header>
        <div className={styles.liveLayout}>
          <div className={styles.liveMap}>
            <NeighborhoodMap actions={open} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          <aside className={styles.upcoming} aria-label={text.live.upcoming}>
            <h3 className={styles.upcomingTitle}>{text.live.upcoming}</h3>
            {loading && (
              <p className={styles.state} role="status">
                {text.live.loading}
              </p>
            )}
            {error && (
              <div className={styles.state} role="alert">
                <p>{text.live.error}</p>
                <Button variant="secondary" onClick={reload}>
                  {text.live.retry}
                </Button>
              </div>
            )}
            {!loading && !error && upcoming.length === 0 && <p className={styles.state}>{text.live.empty}</p>}
            {upcoming.length > 0 && (
              <ul className={styles.upcomingList}>
                {upcoming.map((action) => (
                  <li key={action.action_id}>
                    <ActionCard action={action} selected={action.action_id === selectedId} onSelect={openOnMap} />
                  </li>
                ))}
              </ul>
            )}
            <ButtonLink to={ROUTES.map} variant="secondary" block>
              {text.live.cta}
            </ButtonLink>
          </aside>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="categories-title">
        <header className={styles.sectionHead}>
          <p className={styles.eyebrow}>{text.categories.eyebrow}</p>
          <h2 id="categories-title">{text.categories.title}</h2>
        </header>
        <ul className={styles.categories}>
          {Object.values(CATEGORY).map((category) => (
            <li key={category} className={[styles.category, styles[category.toLowerCase()]].join(' ')}>
              <span className={styles.categoryIcon}>
                <Icon name={CATEGORY_ICONS[category]} size={22} />
              </span>
              <h3>{CATEGORY_LABELS[category]}</h3>
              <p>{text.categories.items[category]}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.closing} aria-labelledby="closing-title">
        <h2 id="closing-title">{text.closing.title}</h2>
        <p>{text.closing.lead}</p>
        <div className={styles.closingActions}>
          <ButtonLink to={ROUTES.register} variant="accent" size="lg">
            {text.closing.cta}
          </ButtonLink>
          <Link to={ROUTES.login} className={styles.closingLink}>
            {text.closing.signIn}
          </Link>
        </div>
      </section>
    </div>
  );
}
