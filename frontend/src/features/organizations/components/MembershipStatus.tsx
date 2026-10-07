import { useState } from 'react';
import { useLocation } from 'react-router';
import { AUTH_ROUTES, useAuth } from '@/features/auth';
import { Button, ButtonLink, Icon } from '@/shared/ui';
import { joinOrganization } from '../api/organizationsApi';
import { toJoinFailure, type JoinFailure } from '../errors';
import { ORGANIZATIONS_LABELS } from '../labels';
import type { RoleOrg } from '../types';
import styles from './MembershipStatus.module.css';

type MembershipStatusProps = {
  organizationId: string;
  /** Mon rôle si je suis membre actif ; `null` sinon (visiteur, non-membre, demande en attente : indistincts). */
  role: RoleOrg | null;
};

type Request = { state: 'idle' | 'sending' | 'sent' } | JoinFailure;

const text = ORGANIZATIONS_LABELS.membership;

/**
 * Ma relation à l'organisation, en tête de fiche : mon rôle si j'en suis membre, sinon le bouton « Join ».
 * Le backend ne laisse pas un demandeur lire sa demande : après un rechargement le bouton revient, et c'est la
 * réponse au second clic (409) qui dit « en attente », « refusée » ou « déjà membre ».
 */
export function MembershipStatus({ organizationId, role }: MembershipStatusProps) {
  const { status } = useAuth();
  const location = useLocation();
  const [request, setRequest] = useState<Request>({ state: 'idle' });

  if (role) {
    return (
      <p className={styles.badge}>
        <Icon name="check" size={16} strokeWidth={2.4} />
        {text.roles[role]}
      </p>
    );
  }
  if (status === 'loading') return null;
  if (status === 'anonymous') {
    return (
      <ButtonLink to={AUTH_ROUTES.login} state={{ from: location }}>
        {text.signInToJoin}
      </ButtonLink>
    );
  }

  const join = async () => {
    setRequest({ state: 'sending' });
    try {
      await joinOrganization(organizationId);
      setRequest({ state: 'sent' });
    } catch (failure) {
      setRequest(toJoinFailure(failure));
    }
  };

  if (request.state === 'sent') {
    return (
      <p className={styles.note} role="status">
        <Icon name="check" size={16} strokeWidth={2.4} />
        {text.sent}
      </p>
    );
  }
  // Réponses définitives du backend : le bouton n'a plus de raison d'être.
  if (request.state === 'pending' || request.state === 'declined' || request.state === 'banned' || request.state === 'member') {
    return (
      <p className={styles.note} role="status">
        {request.message}
      </p>
    );
  }

  return (
    <div className={styles.join}>
      <Button onClick={join} loading={request.state === 'sending'} loadingLabel={text.joining}>
        <Icon name="plus" size={18} strokeWidth={2.2} />
        {text.join}
      </Button>
      {request.state === 'error' && (
        <p className={styles.error} role="alert">
          {request.message}
        </p>
      )}
    </div>
  );
}
