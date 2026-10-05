import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/shared/ui/Button/Button';
import { useActions } from '../api/useActions';
import { ActionCard } from '../components/ActionCard';
import { CategoryFilter } from '../components/CategoryFilter';
import type { Category } from '../types';
import styles from './ActionsListPage.module.css';
import { getCurrentUserSummary, getProfileParticipations } from '@/features/profile/api/profileApi';

const PAGE_SIZE = 6;

export function ActionsListPage() {
  const navigate = useNavigate();
  const { actions, loading, error, reload } = useActions();

  const [category, setCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [participatedActionIds, setParticipatedActionIds] = useState<Set<string>>(
    new Set(),
  );

  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadMyActionContext = async () => {
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

    loadMyActionContext();
  }, []);

  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      const isMine =
        action.creator_id === currentUserId ||
        participatedActionIds.has(action.action_id);

      const matchesCategory =
        category === null || action.category === category;

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
          <h1 className={styles.title}>Citizen Actions</h1>
            <Button onClick={() => navigate('/actions/new')}>
              New Action
            </Button>
        </div>
      </header>

      <section className={styles.controls} aria-label="Filters and search">
        <div className={styles.searchBar}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search by title or keyword..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        <CategoryFilter value={category} onChange={handleCategoryChange} />
          <select
            value={status ?? ''}
            onChange={(event) => {
              setStatus(event.target.value || null);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
       </section>

      {loading && <div className={styles.statusMessage}>Loading actions...</div>}

      {!loading && error && (
        <div className={styles.statusMessage}>
          <span>An error occurred while fetching actions.</span>
          <Button onClick={reload}>Retry</Button>
        </div>
      )}

      {!loading && !error && filteredActions.length === 0 && (
        <div className={styles.statusMessage}>No actions match your criteria.</div>
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
                Previous
              </Button>
              <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </footer>
          )}
        </>
      )}
    </div>
  );
}