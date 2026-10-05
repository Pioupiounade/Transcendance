import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router';
import { AUTH_ROUTES, useAuth } from '@/features/auth';
import { pageTitle } from '@/shared/lib/pageTitle';
import { prefersReducedMotion } from '@/shared/lib/prefersReducedMotion';
import { Button, Icon } from '@/shared/ui';
import { useActions } from '../api/useActions';
import { ActionCard } from '../components/ActionCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { CreateActionDialog } from '../components/CreateActionDialog';
import { NeighborhoodMap } from '../components/NeighborhoodMap';
import { DRAFT_PARAM, formatDraft, parseDraft } from '../draftParam';
import { ACTIONS_LABELS } from '../labels';
import { FOCUS_PARAM } from '../mapConfig';
import { canManageAction } from '../permissions';
import { OPEN_STATUSES, type ActionRecord, type Category, type LatLng } from '../types';
import styles from './MapPage.module.css';
import { getCurrentUserSummary, getProfileParticipations } from '@/features/profile/api/profileApi';

const text = ACTIONS_LABELS.map;
const create = ACTIONS_LABELS.create;

type MapPageProps = {
  /** Chemins des pages créer / modifier : `app/` les connaît, la feature non. */
  createPath: string;
  editPath: (id: string) => string;
};

export function MapPage({ createPath, editPath }: MapPageProps) {
  const { actions, loading, error, reload } = useActions();
  const { status, user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState<Category | null>(null);
  // À l'arrivée depuis créer/modifier : `?focus=<id>` sélectionne l'action, `state.notice` confirme.
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get(FOCUS_PARAM));
  const [composing, setComposing] = useState(false);
  const [notice, setNotice] = useState<string | null>(
    () => (location.state as { notice?: string } | null)?.notice ?? null,
  );
  const listRef = useRef<HTMLUListElement>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [participatedActionIds, setParticipatedActionIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
  const loadMapContext = async () => {
    const [{ userId }, participations] = await Promise.all([
      getCurrentUserSummary(),
      getProfileParticipations(),
    ]);

    setCurrentUserId(userId);

    setParticipatedActionIds(
      new Set(
        participations.map((participation) => participation.actionId),
      ),
    );
  };

  loadMapContext();
}, []);
  // Le brouillon vit dans l'URL (`?at=lat,lng`) : il survit à un passage par /login et au rechargement.
  const draftParam = searchParams.get(DRAFT_PARAM);
  const draft = useMemo(() => parseDraft(draftParam), [draftParam]);
  const setDraft = useCallback(
    (next: LatLng | null) => {
      if (next) setNotice(null);
      setSearchParams(
        (params) => {
          if (next) params.set(DRAFT_PARAM, formatDraft(next));
          else params.delete(DRAFT_PARAM);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Mémoïsé : la carte se recadre quand cette liste change.
  const visible = useMemo(
    () =>
      actions.filter((action) => {
        const isCreatedByMe = action.creator_id === currentUserId;

        const alreadyParticipating =
          participatedActionIds.has(action.action_id);

        const matchesCategory =
          category === null || action.category === category;

        return (
          action.status === 'PENDING' &&
          !isCreatedByMe &&
          !alreadyParticipating &&
          matchesCategory
        );
      }),
    [
      actions,
      category,
      currentUserId,
      participatedActionIds,
    ],
  );

  // Dérivé pendant le rendu : une sélection qui sort du filtre disparaît sans effet.
  const selected = selectedId !== null && visible.some((a) => a.action_id === selectedId) ? selectedId : null;

  useEffect(() => {
    if (selected === null) return;
    listRef.current
      ?.querySelector(`[data-action-id="${CSS.escape(selected)}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [selected]);

  const onCreated = (action: ActionRecord) => {
    setComposing(false);
    setDraft(null);
    setSelectedId(action.action_id);
    setNotice(create.submitted);
    reload();
  };

  const showEmpty = !loading && !error && visible.length === 0;

  const navigate = useNavigate();

  const handleOpenAction = (id: string) => {
    navigate(`/actions/${id}`);
  };

  return (
    <section className={styles.page}>
      <title>{pageTitle(text.title)}</title>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p className={styles.lead}>{text.lead}</p>
      </header>

      <CategoryFilter value={category} onChange={setCategory} />

      <div className={styles.layout}>
        <NeighborhoodMap
          actions={visible}
          selectedId={selected}
          onSelect={setSelectedId}
          draft={draft}
          onDraftChange={setDraft}
          draftContent={
            <>
              {status === 'authenticated' && <Button onClick={() => setComposing(true)}>{create.start}</Button>}
              {status === 'anonymous' && (
                <Link to={AUTH_ROUTES.login} state={{ from: location }} className={styles.signIn}>
                  {create.signIn}
                </Link>
              )}
              <Button variant="text" onClick={() => setDraft(null)}>
                {create.discard}
              </Button>
            </>
          }
        />

        <aside className={styles.list} aria-label={text.listTitle}>
          <div className={styles.listTitle}>
            <h2>{text.listTitle}</h2>
            <span className={styles.count}>{visible.length}</span>
          </div>

          {notice && (
            <p className={[styles.state, styles.success].join(' ')} role="status">
              <Icon name="check" size={16} strokeWidth={2.4} />
              {notice}
            </p>
          )}
          {loading && (
            <p className={styles.state} role="status">
              {text.loading}
            </p>
          )}
          {error && (
            <div className={styles.state} role="alert">
              <p>{text.error}</p>
              <Button variant="secondary" onClick={reload}>
                {text.retry}
              </Button>
            </div>
          )}
          {showEmpty && <p className={styles.state}>{actions.length === 0 ? text.empty : text.emptyFiltered}</p>}

          <ul ref={listRef} className={styles.cards}>
            {visible.map((action) => (
              <li key={action.action_id} data-action-id={action.action_id}>
                <ActionCard
                  action={action}
                  selected={action.action_id === selected}
                  onSelect={handleOpenAction}
                  editTo={canManageAction(action, user) ? editPath(action.action_id) : undefined}
                />
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <p className={styles.note}>
        <Icon name="lock" size={16} />
        {text.privacyNote}
      </p>

      <CreateActionDialog
        location={composing ? draft : null}
        onClose={() => setComposing(false)}
        onCreated={onCreated}
      />
    </section>
  );
}
