import { useMemo, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/features/auth';
import { useMyParticipations } from '@/features/participations';
import { pageTitle } from '@/shared/lib/pageTitle';
import { Button } from '@/shared/ui/Button/Button';
import { useActions } from '../api/useActions';
import { ActionCard } from '../components/ActionCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { MyActionsSignIn } from '../components/MyActionsSignIn';
import { ACTIONS_LABELS } from '../labels';
import { OPEN_STATUSES, type Action, type Category } from '../types';
import styles from './ActionsListPage.module.css';

const PAGE_SIZE = 6;
const text = ACTIONS_LABELS.myActions;

// Même ordre que l'agenda de l'accueil : les actions ouvertes d'abord, la plus proche en tête, puis les terminées et
// annulées, la plus récente en tête. `GET /actions` arrive sans ordre : une action créée tombait en dernière page.
const byAgenda = (a: Action, b: Action): number => {
  const openA = OPEN_STATUSES.includes(a.status);
  const openB = OPEN_STATUSES.includes(b.status);
  if (openA !== openB) return openA ? -1 : 1;
  return openA ? a.scheduled_at.localeCompare(b.scheduled_at) : b.scheduled_at.localeCompare(a.scheduled_at);
};

export function ActionsListPage() {
  const navigate = useNavigate();
  const { status: authStatus, user } = useAuth();
  const { actions, loading, error, reload } = useActions();

  const [category, setCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const [status, setStatus] = useState<string | null>(null);

  // « Mes actions » = créées par moi ou rejointes (visiteur : aucune, aucun appel).
  const currentUserId = authStatus === 'authenticated' ? (user?.user_id ?? null) : null;
  const { participations } = useMyParticipations();
  const participatedActionIds = useMemo(
    () => new Set(participations.map((participation) => participation.action_id)),
    [participations],
  );

  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      const isMine =
        action.creator_id === currentUserId ||
        participatedActionIds.has(action.action_id);

      const matchesCategory = category === null || action.category === category;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        query === '' ||
        action.title.toLowerCase().includes(query) ||
        action.description.toLowerCase().includes(query);

      const matchesStatus = status === null || action.status === status;

      return isMine && matchesCategory && matchesStatus && matchesQuery;
    }).sort(byAgenda);
  }, [
    actions,
    category,
    status,
    searchQuery,
    currentUserId,
    participatedActionIds,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredActions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedActions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredActions.slice(start, start + PAGE_SIZE);
  }, [filteredActions, currentPage]);

  // Titre d'onglet « My Actions · pioupiounades » dans les trois états (visiteur, restauration de session, liste).
  const tabTitle = <title>{pageTitle(text.eyebrow)}</title>;

  if (authStatus === 'anonymous') {
    return (
      <>
        {tabTitle}
        <MyActionsSignIn />
      </>
    );
  }
  if (authStatus === 'loading') {
    return (
      <div className={styles.container}>
        {tabTitle}
        <div className={styles.statusMessage} role="status">
          {text.loading}
        </div>
      </div>
    );
  }

  const handleSelect = (id: string) => {
    navigate(`/actions/${id}`);
  };

  const handleCategoryChange = (selected: Category | null) => {
    setCategory(selected);
    setPage(1);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  return (
    <div className={styles.container}>
      {tabTitle}
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>{text.listTitle}</h1>
          <Button onClick={() => navigate('/actions/new')}>
            {text.newAction}
          </Button>
        </div>
      </header>

      <section className={styles.controls} aria-label="Filters and search">
        <div className={styles.searchBar}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder={text.searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        <CategoryFilter value={category} onChange={handleCategoryChange} />
        <select
          value={status ?? ''}
          aria-label="Filter by status"
          onChange={(event) => {
            setStatus(event.target.value || null);
            setPage(1);
          }}
        >
          <option value="">{text.allStatuses}</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </section>

      {loading && <div className={styles.statusMessage}>{text.loading}</div>}

      {!loading && error && (
        <div className={styles.statusMessage}>
          <span>{ACTIONS_LABELS.map.error}</span>
          <Button onClick={reload}>{ACTIONS_LABELS.map.retry}</Button>
        </div>
      )}

      {!loading && !error && filteredActions.length === 0 && (
        <div className={styles.statusMessage}>{text.emptyFiltered}</div>
      )}

      {!loading && !error && filteredActions.length > 0 && (
        <>
          <main className={styles.grid}>
            {paginatedActions.map((action) => (
              <ActionCard
                key={action.action_id}
                action={action}
                selected={false}
                onSelect={handleSelect}
              />
            ))}
          </main>

          {totalPages > 1 && (
            <footer className={styles.pagination}>
              <Button
                variant="secondary"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {text.previous}
              </Button>
              <span className={styles.pageInfo}>
                {text.pageInfo(currentPage, totalPages)}
              </span>
              <Button
                variant="secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {text.next}
              </Button>
            </footer>
          )}
        </>
      )}
    </div>
  );
}