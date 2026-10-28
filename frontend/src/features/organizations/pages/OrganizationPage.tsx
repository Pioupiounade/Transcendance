import { Link, useParams, useNavigate } from 'react-router';
import { PlaceMap } from '@/features/actions';
import { ROLE_APP, useAuth } from '@/features/auth';
import { formatDayMonth } from '@/shared/lib/formatDate';
import { pageTitle } from '@/shared/lib/pageTitle';
import { Avatar, ButtonLink, Icon } from '@/shared/ui';
import {
  useMyOrganizationMembership,
  useOrganization,
  useOrganizationMembers,
} from '../api/useOrganization';
import { MembershipStatus } from '../components/MembershipStatus';
import { OrganizationActions } from '../components/OrganizationActions';
import { OrganizationComments } from '../components/OrganizationComments';
import { ORGANIZATIONS_LABELS, ORGANIZATION_STATUS_LABELS, ROLE_ORG_LABELS } from '../labels';
import { managerLevel } from '../permissions';
import { ORGANIZATION_STATUS } from '../types';
import styles from './OrganizationPage.module.css';
import { useEffect } from 'react';

type OrganizationPageProps = {
  /** Chemin de la liste, pour le retour. */
  listPath: string;
  /** Où mène une action à venir de l'organisation (la carte, centrée sur elle). */
  upcomingActionPath: (actionId: string) => string;
  /** Tableau de bord de gestion (#62), proposé aux gestionnaires et aux ADMIN. */
  managePath: (id: string) => string;
};

const text = ORGANIZATIONS_LABELS.detail;

const sinceLabel = (iso: string): string => {
  const parts = formatDayMonth(iso);
  const year = new Date(iso).getFullYear();
  return parts ? `${parts.month} ${year}` : '';
};

/**
 * `/organizations/:id` : fiche publique (#64). En-tête avec ma relation à l'organisation (rôle ou « Join »), puis
 * à gauche « About », ses actions et la discussion (#71), à droite le lieu sur une mini-carte et les membres actifs.
 */

export function OrganizationPage({ listPath, upcomingActionPath, managePath }: OrganizationPageProps) {
  const { id = '' } = useParams<{ id: string }>();
  const { status, user } = useAuth();
  const { organization, loading, notFound, error, reload: reloadOrganization } =
    useOrganization(id);

  const organizationAvailable =
    !loading &&
    organization != null &&
    !notFound &&
    !error;

  const members = useOrganizationMembers(
    id,
    organizationAvailable,
  );

  const membership = useMyOrganizationMembership(
    id,
    status === 'authenticated' && organizationAvailable,
  );

  useEffect(() => {
    const handleMembershipChanged = (event: Event) => {
      const detail = (
        event as CustomEvent<{ organizationId: string }>
      ).detail;

      if (detail?.organizationId !== id) return;

      members.reload();
      membership.reload();
    };

    window.addEventListener(
      'organization:membership-changed',
      handleMembershipChanged,
    );

    return () => {
      window.removeEventListener(
        'organization:membership-changed',
        handleMembershipChanged,
      );
    };
  }, [id, members.reload, membership.reload]);

  useEffect(() => {
    const handleOrganizationUpdated = (event: Event) => {
      const { organizationId } = (
        event as CustomEvent<{ organizationId: string }>
      ).detail;

      if (organizationId !== id) return;

      reloadOrganization();
    };

    window.addEventListener('organization:updated', handleOrganizationUpdated);

    return () => {
      window.removeEventListener('organization:updated', handleOrganizationUpdated);
    };
  }, [id, reloadOrganization]);

  // La liste publique ne contient que les membres actifs : m'y trouver = être membre.
  const myRole = members.members.find((member) => member.user_id === user?.user_id)?.role ?? null;
  const canManage = managerLevel(myRole, user?.role === ROLE_APP.ADMIN) !== null;

  const inactive = organization !== null && organization.organization_status !== ORGANIZATION_STATUS.ACTIVE;

  const navigate = useNavigate();

  return (
    <section className={styles.page}>
      <title>{pageTitle(organization?.title ?? text.eyebrow)}</title>
      <Link to={listPath} className={styles.back}>
        ← {text.back}
      </Link>

      {loading && (
        <p className={styles.state} role="status">
          {text.loading}
        </p>
      )}
      {notFound && (
        <div
          className={styles.state}
          role="status"
          style={{ textAlign: 'center', padding: '4rem 1rem' }}
        >
          <h2>Organization not found</h2>
          <p>{text.notFound}</p>
          <ButtonLink to={listPath} variant="secondary">
            {text.back}
          </ButtonLink>
        </div>
      )}

      {error && (
        <div className={styles.state} role="alert">
          <p>{text.error}</p>
          <ButtonLink to={listPath} variant="secondary">
            {text.back}
          </ButtonLink>
        </div>
      )}

      {organization && (
        <>
          <header className={styles.head}>
            <span className={styles.icon}>
              <Icon name="building" size={30} />
            </span>
            <div className={styles.headText}>
              <p className={styles.eyebrow}>
                {text.eyebrow}
                {inactive && (
                  <span className={styles.status}>{ORGANIZATION_STATUS_LABELS[organization.organization_status]}</span>
                )}
              </p>
              <h1>{organization.title}</h1>
              <p className={styles.address}>
                <Icon name="pin" size={15} />
                {organization.address}
              </p>
            </div>
            {/* Après les membres (pour connaître mon rôle) ; pas de « Join » sur une organisation inactive. */}
            {!members.loading && (myRole || canManage || !inactive) && (
              <div className={styles.membership}>
                {(myRole || !inactive) && (
                  <MembershipStatus
                    key={`${organization.organization_id}:${user?.user_id ?? ''}`}
                    organizationId={organization.organization_id}
                    role={myRole}
                    membership={membership.membership}
                    canLeave={!inactive}
                    hasOtherMembers={members.members.some(
                      (member) => member.user_id !== user?.user_id,
                    )}
                    onLeft={(organizationClosed) => {
                      if (organizationClosed) {
                        navigate(listPath);
                        return;
                      }

                      members.reload();
                      membership.reload();
                    }}
                  />
                )}
                {canManage && (
                  <ButtonLink to={managePath(organization.organization_id)} variant="secondary">
                    {ORGANIZATIONS_LABELS.manage.link}
                  </ButtonLink>
                )}
              </div>
            )}
          </header>

          <div className={styles.body}>
            <section className={[styles.panel, styles.about].join(' ')} aria-labelledby="about-title">
              <h2 id="about-title">{text.about}</h2>
              <p className={styles.description}>{organization.description}</p>
              <p className={styles.since}>{text.since(sinceLabel(organization.created_at))}</p>
            </section>

            <section className={[styles.panel, styles.location].join(' ')} aria-labelledby="where-title">
              <h2 id="where-title">{text.where}</h2>
              <div className={styles.placeMap}>
                <PlaceMap location={organization.location} name={organization.title} icon="building" />
              </div>
              <p className={styles.address}>
                <Icon name="pin" size={15} />
                {organization.address}
              </p>
            </section>

            <div className={styles.actions}>
              <OrganizationActions organizationId={organization.organization_id} upcomingPath={upcomingActionPath} />
            </div>

            <section className={[styles.panel, styles.membersPanel].join(' ')} aria-labelledby="members-title">
              <div className={styles.panelHead}>
                <h2 id="members-title">{text.members}</h2>
                {!members.loading && !members.error && <span className={styles.count}>{members.members.length}</span>}
              </div>
              {members.loading && (
                <p className={styles.muted} role="status">
                  {text.membersLoading}
                </p>
              )}
              {members.error && (
                <p className={styles.muted} role="alert">
                  {text.membersError}
                </p>
              )}
              {!members.loading && !members.error && members.members.length === 0 && (
                <p className={styles.muted}>{text.membersEmpty}</p>
              )}
              {members.members.length > 0 && (
                <ul className={styles.members}>
                  {members.members.map((member) => {
                    const name = member.user.profile?.username ?? text.anonymousMember;
                    const profilePath =
                      user && String(user.user_id) === String(member.user_id)
                        ? '/profile'
                        : `/profiles/${member.user_id}`;

                    return (
                      <li key={member.user_id} className={styles.member}>
                        <Link
                          to={profilePath}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            textDecoration: 'none',
                            color: 'inherit',
                          }}
                        >
                          <Avatar name={name} src={member.user.profile?.profile_picture ?? undefined} size={36} />
                          <span className={styles.memberName}>
                            {name}
                            {member.user_id === user?.user_id && <span className={styles.you}>{text.you}</span>}
                          </span>
                        </Link>
                        <span className={styles.role}>{ROLE_ORG_LABELS[member.role]}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <div className={styles.discussion}>
              <OrganizationComments
                organizationId={organization.organization_id}
                creatorId={organization.creator_id}
                canComment={
                  !inactive && membership.membership?.status === 'ACTIVE'
                }              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}