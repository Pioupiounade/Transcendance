import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  globalSearch,
  type GlobalSearchResults,
} from '../api/globalSearchApi';
import { organizationPath } from '../routes';
import styles from './GlobalSearch.module.css';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [deletionVersion, setDeletionVersion] = useState(0);
  const [results, setResults] = useState<GlobalSearchResults>({
    users: [],
    organizations: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleUserDeleted = (event: Event) => {
      const { userId } = (
        event as CustomEvent<{ userId: string }>
      ).detail;

      setResults((current) => ({
        ...current,
        users: current.users.filter((user) => user.user_id !== userId),
      }));

      setDeletionVersion((version) => version + 1);
    };

    window.addEventListener('user:deleted', handleUserDeleted);

    return () => {
      window.removeEventListener('user:deleted', handleUserDeleted);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults({
        users: [],
        organizations: [],
      });
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(() => {
      setLoading(true);

      globalSearch(trimmed, controller.signal)
        .then((next) => {
          if (!controller.signal.aborted) {
            setResults(next);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setResults({
              users: [],
              organizations: [],
            });
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 250);

    
  
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, deletionVersion]);

  const showResults = query.trim().length >= 2;

  return (
    <div className={styles.search}>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search.."
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '999px',
          border: '1px solid var(--line, #e2e8f0)',
        }}
      />

      {showResults && (
        <div
          className={styles.results}
          style={{
            background: 'var(--ground, #ffffff)',
            border: '1px solid var(--line, #e2e8f0)',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden',
          }}
        >
          {loading && (
            <div style={{ padding: '12px' }}>
                Searching...
            </div>
            )}

            {!loading &&
            results.users.length === 0 &&
            results.organizations.length === 0 && (
                <div
                style={{
                    padding: '12px',
                    color: 'var(--muted, #64748b)',
                    textAlign: 'center',
                }}
                >
                No results found.
                </div>
            )}
            {!loading && results.users.length > 0 && (
            <div>
                <div
                style={{
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--muted, #64748b)',
                }}
                >
                USERS
                </div>

                {results.users.map((user) => (
                <Link
                    key={user.user_id}
                    to={`/profiles/${user.user_id}`}
                    onClick={() => setQuery('')}
                    style={{
                    display: 'block',
                    padding: '10px 12px',
                    textDecoration: 'none',
                    color: 'inherit',
                    }}
                >
                    @{user.username}
                </Link>
                ))}
            </div>
            )}
          {!loading && results.organizations.length > 0 && (
            <div>
              <div
                style={{
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--muted, #64748b)',
                }}
              >
                ORGANIZATIONS
              </div>

              {results.organizations.map((organization) => (
                <Link
                  key={organization.organization_id}
                  to={organizationPath(organization.organization_id)}
                  onClick={() => setQuery('')}
                  style={{
                    display: 'block',
                    padding: '10px 12px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  {organization.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}