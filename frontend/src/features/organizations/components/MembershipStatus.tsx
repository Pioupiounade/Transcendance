import { useState } from 'react';
import { useLocation } from 'react-router';
import { AUTH_ROUTES, useAuth } from '@/features/auth';
import { Button, ButtonLink, Icon } from '@/shared/ui';
import { joinOrganization, leaveOrganization } from '../api/organizationsApi';
import { toJoinFailure, type JoinFailure } from '../errors';
import { ORGANIZATIONS_LABELS } from '../labels';
import type { MemberStatus, RoleOrg } from '../types';
import styles from './MembershipStatus.module.css';

type MembershipStatusProps = {
  organizationId: string;
  role: RoleOrg | null;
  membership: {
    status: MemberStatus;
    role: RoleOrg;
  } | null;
  canLeave: boolean;
  hasOtherMembers: boolean;
  onLeft: (organizationClosed: boolean) => void;
};

type Request = { state: 'idle' | 'sending' | 'sent' } | JoinFailure;

const text = ORGANIZATIONS_LABELS.membership;

/**
 * Ma relation à l'organisation, en tête de fiche : mon rôle si j'en suis membre, sinon le bouton « Join ».
 * Le backend ne laisse pas un demandeur lire sa demande : après un rechargement le bouton revient, et c'est la
 * réponse au second clic (409) qui dit « en attente », « refusée » ou « déjà membre ».
 */
export function MembershipStatus({
    organizationId,
    role,
    membership,
    canLeave,
    hasOtherMembers,
    onLeft,
  }: MembershipStatusProps) {
  const { status } = useAuth();
  const location = useLocation();
  const [request, setRequest] = useState<Request>({ state: 'idle' });
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  
  // Ma relation vient de changer côté serveur (retiré, réactivé…) : la demande locale ne vaut plus.
  // Ajustement pendant le rendu, sans effet (règle react-hooks/set-state-in-effect).
  const membershipKey = `${organizationId}:${membership?.status ?? 'none'}:${membership?.role ?? 'none'}`;
  const [seenMembershipKey, setSeenMembershipKey] = useState(membershipKey);
  if (seenMembershipKey !== membershipKey) {
    setSeenMembershipKey(membershipKey);
    setRequest({ state: 'idle' });
  }
 
  const leave = async () => {
    setLeaveError(null);

    if (role === 'OWNER' && hasOtherMembers) {
      setLeaveError(
        'Transfer ownership to another member before leaving.',
      );
      return;
    }

    const message =
      role === 'OWNER'
        ? 'You are the last member. Leaving will close this organization. Continue?'
        : 'Are you sure you want to leave this organization?';

    if (!window.confirm(message)) return;

    setLeaving(true);

    try {
      const result = await leaveOrganization(organizationId);
      setRequest({ state: 'idle' });
      onLeft(result.organizationClosed);
    } catch {
      setLeaveError(
        'Unable to leave the organization. Its membership may have changed; refresh and try again.',
      );
    } finally {
      setLeaving(false);
    }
  };
  
  if (membership?.status === 'PENDING') {
    return (
      <p className={styles.note} role="status">
        <Icon name="check" size={16} strokeWidth={2.4} />
        {text.sent}
      </p>
    );
  }

  if (membership?.status === 'REJECTED') {
    return (
      <p className={styles.note} role="status">
        {text.declined}
      </p>
    );
  }

  if (membership?.status === 'BANNED') {
    return (
      <p className={styles.note} role="status">
        {text.banned}
      </p>
    );
  }

  if (role) {
    return (
      <p className={styles.note} role="status">
        {text.declined}
      </p>
    );
  }

  if (membership?.status === 'BANNED') {
    return (
      <p className={styles.note} role="status">
        {text.banned}
      </p>
    );
  }

  if (role) {
    return (
      <div className={styles.join}>
        <p className={styles.badge}>
          <Icon name="check" size={16} strokeWidth={2.4} />
          {text.roles[role]}
        </p>

        {canLeave && (
          <Button
            variant="secondary"
            onClick={() => void leave()}
            disabled={leaving}
          >
            {leaving ? 'Leaving…' : 'Leave organization'}
          </Button>
        )}

        {leaveError && (
          <p className={styles.error} role="alert">
            {leaveError}
          </p>
        )}
      </div>
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
