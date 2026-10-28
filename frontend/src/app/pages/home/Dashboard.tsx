import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CategoryFilter,
  DEFAULT_CENTER,
  NeighborhoodMap,
  OPEN_STATUSES,
  distanceMeters,
  useActions,
  type Action,
  type Category,
} from '@/features/actions';
import type { AuthUser } from '@/features/auth';
import { useMyParticipations } from '@/features/participations';
import { useMyProfile } from '@/features/profile';
import { pageTitle } from '@/shared/lib/pageTitle';
import { ButtonLink, Icon } from '@/shared/ui';
import { APP_LABELS } from '../../labels';
import { ROUTES, actionDetailPath, editActionPath } from '../../routes';
import { MyActionsPanel, type AgendaItem } from './MyActionsPanel';
import { NearbyActions, type NearbyAction } from './NearbyActions';
import styles from './Dashboard.module.css';

type DashboardProps = { user: AuthUser };

const text = APP_LABELS.pages.dashboard;
const NEARBY_LIMIT = 6;
/* Anneau de la jauge : rayon 20 dans une boîte de 48. */
const RING = 2 * Math.PI * 20;

/** Tableau de bord du quartier (refonte) : salutation, jauge d'engagement, filtres, carte, agenda, actions proches. */
export function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();
  const actionsState = useActions();
  const participationsState = useMyParticipations();
  const { profile } = useMyProfile();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);

  const openAll = useMemo(
    () => actionsState.actions.filter((action) => OPEN_STATUSES.includes(action.status)),
    [actionsState.actions],
  );
  const open = useMemo(
    () => (category === null ? openAll : openAll.filter((action) => action.category === category)),
    [openAll, category],
  );

  const joinedIds = useMemo(
    () =>
      new Set(
        participationsState.participations
          .filter((participation) => OPEN_STATUSES.includes(participation.status))
          .map((participation) => participation.action_id),
      ),
    [participationsState.participations],
  );

  // Mon agenda : les actions ouvertes que j'organise et celles que j'ai rejointes, par date.
  const agenda = useMemo<AgendaItem[]>(() => {
    const organised = openAll
      .filter((action) => action.creator_id === user.user_id)
      .map<AgendaItem>((action) => ({
        id: action.action_id,
        title: action.title,
        category: action.category,
        status: action.status,
        scheduledAt: action.scheduled_at,
        role: 'organiser',
        to: editActionPath(action.action_id),
      }));
    const joined = participationsState.participations
      .filter((participation) => OPEN_STATUSES.includes(participation.status))
      .map<AgendaItem>((participation) => ({
        id: participation.action_id,
        title: participation.title,
        category: participation.category,
        status: participation.status,
        scheduledAt: participation.scheduled_at,
        role: 'participant',
        to: actionDetailPath(participation.action_id),
      }));
    return [...organised, ...joined].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }, [openAll, participationsState.participations, user.user_id]);

  // Autour de moi : les actions ouvertes des autres, les plus proches du point de référence d'abord.
  const reference = profile?.location ?? DEFAULT_CENTER;
  const nearby = useMemo<NearbyAction[]>(
    () =>
      open
        .filter((action: Action) => action.creator_id !== user.user_id && !joinedIds.has(action.action_id))
        .map((action) => ({ action, distance: distanceMeters(reference, action.location) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, NEARBY_LIMIT),
    [open, joinedIds, reference, user.user_id],
  );

  const name = profile?.username ?? text.anonymousName;
  const ratio = openAll.length === 0 ? 0 : Math.min(1, agenda.length / openAll.length);

  return (
    <section className={styles.page}>
      <title>{pageTitle(APP_LABELS.nav.home)}</title>

      <header className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>{text.eyebrow}</p>
          <h1>{text.greeting(name)}!</h1>
          <p className={styles.lead}>{text.lead}</p>
        </div>
        {/* Jauge : part des actions ouvertes du quartier qui sont sur mon agenda ; le « + » suggère une action. */}
        <div className={styles.gauge}>
          <svg className={styles.ring} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
            <circle className={styles.track} cx="24" cy="24" r="20" />
            <circle
              className={styles.progress}
              cx="24"
              cy="24"
              r="20"
              strokeDasharray={`${ratio * RING} ${RING}`}
              transform="rotate(-90 24 24)"
            />
          </svg>
          <div className={styles.gaugeText}>
            <strong>
              {agenda.length}
              <small>/{openAll.length}</small>
            </strong>
            <span>
              {text.gauge.label} · {text.gauge.of(openAll.length)}
            </span>
          </div>
          <ButtonLink to={ROUTES.createAction} variant="accent" className={styles.plus} aria-label={text.suggest} title={text.suggest}>
            <Icon name="plus" size={22} strokeWidth={2.2} />
          </ButtonLink>
        </div>
      </header>

      <CategoryFilter value={category} onChange={setCategory} />

      <div className={styles.layout}>
        <div className={styles.map}>
          <NeighborhoodMap actions={open} selectedId={selectedId} onSelect={setSelectedId} />
          <div className={styles.mapFooter}>
            <span className={styles.privacy}>
              <Icon name="lock" size={16} />
              {text.privacy}
            </span>
            <span>{text.motto}</span>
          </div>
        </div>

        <MyActionsPanel
          items={agenda}
          loading={actionsState.loading || participationsState.loading}
          error={actionsState.error !== null || participationsState.error !== null}
        />
      </div>

      {/* Une carte ouvre la fiche de l'action ; la carte du quartier (au-dessus) reste le lieu de la sélection. */}
      <NearbyActions
        items={nearby}
        selectedId={selectedId}
        onSelect={(id) => navigate(actionDetailPath(id))}
        loading={actionsState.loading}
        error={actionsState.error !== null}
        onRetry={actionsState.reload}
      />
    </section>
  );
}
