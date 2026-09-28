import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_CENTER } from '@/features/actions';
import { useAuth } from '@/features/auth';
import { fetchMyProfile } from '@/features/profile';
import { useResource } from '@/shared/hooks/useResource';
import { pageTitle } from '@/shared/lib/pageTitle';
import { Button, FloatingField } from '@/shared/ui';
import { useOrganizations } from '../api/useOrganizations';
import { OrganizationCard } from '../components/OrganizationCard';
import { OrganizationConstellation } from '../components/OrganizationConstellation';
import { ORGANIZATIONS_LABELS } from '../labels';
import styles from './OrganizationsPage.module.css';

type OrganizationsPageProps = {
  /** Chemin de la fiche d'une organisation ; `app/` le connaît, la feature non. */
  organizationPath: (id: string) => string;
};

const text = ORGANIZATIONS_LABELS.list;
const SEARCH_DELAY_MS = 300;

/** Profil de l'utilisateur connecté (lieu, nom, photo) ; `null` pour un visiteur ou sans profil. */
const useCenterProfile = () => {
  const { status } = useAuth();
  const authenticated = status === 'authenticated';
  const load = useCallback(
    (signal: AbortSignal) => (authenticated ? fetchMyProfile(signal) : Promise.resolve(null)),
    [authenticated],
  );
  return useResource(load).data;
};

/** `/organizations` : constellation autour de l'utilisateur, puis la liste (recherche `GET /organizations/search`). */
export function OrganizationsPage({ organizationPath }: OrganizationsPageProps) {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const { organizations, loading, error, reload } = useOrganizations(query);
  const profile = useCenterProfile();

  // La recherche part 300 ms après la dernière frappe.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(input), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const showEmpty = !loading && !error && organizations.length === 0;

  return (
    <section className={styles.page}>
      <title>{pageTitle(text.title)}</title>
      <header className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p className={styles.lead}>{text.lead}</p>
        </div>
        <form className={styles.search} role="search" onSubmit={(event) => event.preventDefault()}>
          <FloatingField
            id="organization-search"
            type="text"
            label={text.search}
            autoComplete="off"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </form>
      </header>

      <OrganizationConstellation
        organizations={organizations}
        center={profile?.location ?? DEFAULT_CENTER}
        you={profile ? { name: profile.username, picture: profile.profile_picture } : null}
        organizationPath={organizationPath}
      />

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
      {showEmpty && <p className={styles.state}>{query.trim() === '' ? text.empty : text.noMatch(query.trim())}</p>}

      {organizations.length > 0 && (
        <section className={styles.list} aria-labelledby="organizations-list-title">
          <div className={styles.listHead}>
            <h2 id="organizations-list-title">{text.all}</h2>
            <span className={styles.count}>{text.count(organizations.length)}</span>
          </div>
          <ul className={styles.grid}>
            {organizations.map((organization) => (
              <li key={organization.organization_id}>
                <OrganizationCard organization={organization} to={organizationPath(organization.organization_id)} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
