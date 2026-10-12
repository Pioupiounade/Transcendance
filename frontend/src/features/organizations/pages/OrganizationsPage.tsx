import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { DEFAULT_CENTER, formatDistance } from '@/features/actions';
import { useAuth } from '@/features/auth';
import { fetchMyProfile } from '@/features/profile';
import { useResource } from '@/shared/hooks/useResource';
import { pageTitle } from '@/shared/lib/pageTitle';
import { Button, ButtonLink, Icon } from '@/shared/ui';
import { useMyMemberships } from '../api/useMyMemberships';
import { useOrganizations } from '../api/useOrganizations';
import { DirectoryToolbar } from '../components/DirectoryToolbar';
import { OrganizationCard } from '../components/OrganizationCard';
import { OrganizationConstellation } from '../components/OrganizationConstellation';
import { DIRECTORY_SCOPE, directoryParams, listDirectory, readDirectoryView, type DirectoryView } from '../directory';
import { ORGANIZATIONS_LABELS } from '../labels';
import type { Organization } from '../types';
import styles from './OrganizationsPage.module.css';

type OrganizationsPageProps = {
  /** Chemin de la fiche d'une organisation ; `app/` le connaît, la feature non. */
  organizationPath: (id: string) => string;
  /** Page de création (#106), proposée aux seuls connectés. */
  createPath: string;
};

const text = ORGANIZATIONS_LABELS.list;
const PAGE_SIZE = 12;
const NO_ORGANIZATIONS: Organization[] = [];

/** Profil de l'utilisateur connecté (lieu, nom, photo) ; `null` pour un visiteur ou sans profil. */
const useCenterProfile = () => {
  const { status } = useAuth();
  const authenticated = status === 'authenticated';
  const load = useCallback(
    (signal: AbortSignal) => (authenticated ? fetchMyProfile(signal) : Promise.resolve(null)),
    [authenticated],
  );
  return useResource(load);
};

/**
 * `/organizations` : l'annuaire (#63). La constellation autour de l'utilisateur, puis la liste. Recherche, tri,
 * « All / Mine » et organisations fermées vivent dans l'URL (directory.ts) : revenir d'une fiche retrouve la liste.
 */
export function OrganizationsPage({ organizationPath, createPath }: OrganizationsPageProps) {
  const [params, setParams] = useSearchParams();
  const { status } = useAuth();
  const all = useOrganizations();
  const mine = useMyMemberships();
  const profile = useCenterProfile();
  const [shown, setShown] = useState(PAGE_SIZE);

  const authenticated = status === 'authenticated';
  const view = useMemo(() => {
    const requested = readDirectoryView(params);
    // « Mine » n'a de sens que connecté : un lien partagé à un visiteur montre tout.
    return authenticated ? requested : { ...requested, scope: DIRECTORY_SCOPE.ALL };
  }, [params, authenticated]);

  const roles = useMemo(
    () => new Map(mine.memberships.map((membership) => [membership.organization_id, membership.role])),
    [mine.memberships],
  );
  const center = profile.data?.location ?? DEFAULT_CENTER;
  const { entries, inactive } = useMemo(
    () => listDirectory(all.organizations, roles, center, view),
    [all.organizations, roles, center, view],
  );
  // Mémoïsé : une nouvelle liste relance la simulation de la constellation.
  const matching = useMemo(() => entries.map((entry) => entry.organization), [entries]);

  const change = (next: DirectoryView) => {
    setShown(PAGE_SIZE);
    setParams(directoryParams(next), { replace: true });
  };
  const retry = () => {
    all.reload();
    mine.reload();
  };

  const onlyMine = view.scope === DIRECTORY_SCOPE.MINE;
  const loading = all.loading || mine.loading || profile.loading;
  // Sans mes adhésions, « All » reste lisible (sans badge de rôle) ; « Mine » ne l'est pas.
  const failed = !loading && (all.error !== null || (onlyMine && mine.error !== null));
  const ready = !loading && !failed;
  const query = view.query.trim();
  const emptyMessage =
    all.organizations.length === 0
      ? text.empty
      : onlyMine && roles.size === 0
        ? text.emptyMine
        : query !== ''
          ? text.noMatch(query)
          : text.noneShown;
  const hidden = entries.length - shown;

  return (
    <section className={styles.page}>
      <title>{pageTitle(text.title)}</title>
      <header className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p className={styles.lead}>{text.lead}</p>
        </div>
        {/* Créer (#106) : la route est protégée, le bouton n'est proposé qu'à un connecté. */}
        {authenticated && (
          <ButtonLink to={createPath} className={styles.create}>
            <Icon name="plus" size={16} />
            {ORGANIZATIONS_LABELS.create.button}
          </ButtonLink>
        )}
      </header>

      <DirectoryToolbar view={view} onChange={change} canFilterMine={authenticated} inactiveCount={inactive} />

      <OrganizationConstellation
        organizations={ready ? matching : NO_ORGANIZATIONS}
        center={center}
        you={profile.data ? { name: profile.data.username, picture: profile.data.profile_picture } : null}
        organizationPath={organizationPath}
      />

      {loading && (
        <p className={styles.state} role="status">
          {text.loading}
        </p>
      )}
      {failed && (
        <div className={styles.state} role="alert">
          <p>{text.error}</p>
          <Button variant="secondary" onClick={retry}>
            {text.retry}
          </Button>
        </div>
      )}
      {ready && entries.length === 0 && <p className={styles.state}>{emptyMessage}</p>}

      {ready && entries.length > 0 && (
        <section className={styles.list} aria-labelledby="organizations-list-title">
          <div className={styles.listHead}>
            <h2 id="organizations-list-title">{onlyMine ? text.mine : text.all}</h2>
            <span className={styles.count}>{text.count(entries.length)}</span>
          </div>
          <ul className={styles.grid}>
            {entries.slice(0, shown).map(({ organization, distance, role }) => (
              <li key={organization.organization_id}>
                <OrganizationCard
                  organization={organization}
                  to={organizationPath(organization.organization_id)}
                  distance={formatDistance(distance)}
                  role={role}
                />
              </li>
            ))}
          </ul>
          {hidden > 0 && (
            <div className={styles.more}>
              <Button variant="secondary" onClick={() => setShown((count) => count + PAGE_SIZE)}>
                {text.more(Math.min(hidden, PAGE_SIZE))}
              </Button>
            </div>
          )}
        </section>
      )}
    </section>
  );
}
