import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/features/auth';
import { Button } from '@/shared/ui/Button/Button';
import { useActions } from '../api/useActions';
import { ActionCard } from '../components/ActionCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { MyActionsSignIn } from '../components/MyActionsSignIn';
import { ACTIONS_LABELS } from '../labels';
import type { Category } from '../types';
import styles from './ActionsListPage.module.css';
import { getCurrentUserSummary, getProfileParticipations } from '@/features/profile/api/profileApi';

const PAGE_SIZE = 6;
const text = ACTIONS_LABELS.myActions;

export function ActionsListPage() {
  const navigate = useNavigate();
  const { status: authStatus } = useAuth();
  const { actions, loading, error, reload } = useActions();

  const [category, setCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [participatedActionIds, setParticipatedActionIds] = useState<Set<string>>(new Set());
  const [isContextLoading, setIsContextLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      setIsContextLoading(false);
      return;
    }

    let isMounted = true;
    const loadMyActionContext = async () => {
      setIsContextLoading(true);
      try {
        const [{ userId }, participations] = await Promise.all([
          getCurrentUserSummary(),
          getProfileParticipations(),
        ]);

        if (!isMounted) return;
        setCurrentUserId(userId);
        setParticipatedActionIds(
          new Set(participations.map((participation) => participation.actionId)),
        );
      } catch {
        if (!isMounted) return;
        setCurrentUserId(null);
        setParticipatedActionIds(new Set());
      } finally {
        if (isMounted) setIsContextLoading(false);
      }
    };

    loadMyActionContext();
    return () => {
      isMounted = false;
    };
  }, [authStatus]);

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
    });
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

  if (authStatus === 'anonymous') return <MyActionsSignIn />;
  if (authStatus === 'loading' || isContextLoading) {
    return (
      <div className={styles.container}>
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
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>{text.title}</h1>
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