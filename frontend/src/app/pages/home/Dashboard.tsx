import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  DEFAULT_CENTER,
  FOCUS_PARAM,
  NeighborhoodMap,
  OPEN_STATUSES,
  distanceMeters,
  useActions,
  type Action,
} from '@/features/actions';
import type { AuthUser } from '@/features/auth';
import { useMyParticipations } from '@/features/participations';
import { useMyProfile } from '@/features/profile';
import { pageTitle } from '@/shared/lib/pageTitle';
import { Icon } from '@/shared/ui';
import { APP_LABELS } from '../../labels';
import { ROUTES, editActionPath } from '../../routes';
import { MyActionsPanel, type AgendaItem } from './MyActionsPanel';
import { NearbyActions, type NearbyAction } from './NearbyActions';
import styles from './Dashboard.module.css';

type DashboardProps = { user: AuthUser };

const text = APP_LABELS.pages.dashboard;
const NEARBY_LIMIT = 6;

const mapFocusPath = (id: string) => `${ROUTES.map}?${FOCUS_PARAM}=${id}`;

/** Tableau de bord du quartier : carte compacte, mon agenda, actions ouvertes les plus proches. */
export function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();
  const actionsState = useActions();
  const participationsState = useMyParticipations();
  const { profile } = useMyProfile();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const open = useMemo(
    () => actionsState.actions.filter((action) => OPEN_STATUSES.includes(action.status)),
    [actionsState.actions],
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
    const organised = open
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
        to: mapFocusPath(participation.action_id),
      }));
    return [...organised, ...joined].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }, [open, participationsState.participations, user.user_id]);

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

  return (
    <section className={styles.page}>
      <title>{pageTitle(APP_LABELS.nav.home)}</title>

      <header className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>{text.eyebrow}</p>
          <h1>{text.greeting(name)}</h1>
          <p className={styles.lead}>{text.lead}</p>
        </div>
        <div className={styles.chip}>
          <Icon name="pin" size={18} />
          <div>
            <small>{text.exploring}</small>
            <strong>{profile?.location ? text.homeArea : text.defaultArea}</strong>
          </div>
        </div>
      </header>

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

      <NearbyActions
        items={nearby}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          navigate(mapFocusPath(id));
        }}
        loading={actionsState.loading}
        error={actionsState.error !== null}
        onRetry={actionsState.reload}
      />
    </section>
  );
}
