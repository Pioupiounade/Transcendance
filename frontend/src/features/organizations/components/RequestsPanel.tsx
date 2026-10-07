import { useState } from 'react';
import { formatFullDate } from '@/shared/lib/formatDate';
import { Avatar, Button } from '@/shared/ui';
import { toManageErrorMessage } from '../errors';
import { ORGANIZATIONS_LABELS } from '../labels';
import { memberName } from '../memberName';
import type { OrganizationMember } from '../types';
import styles from './ManagePanels.module.css';

type RequestsPanelProps = {
  pending: OrganizationMember[];
  declined: OrganizationMember[];
  /** Organisation inactive : le backend refuse toute décision. */
  disabled: boolean;
  onApprove: (member: OrganizationMember) => Promise<void>;
  /** Refuser est définitif : la page demande confirmation. */
  onDecline: (member: OrganizationMember) => void;
};

const text = ORGANIZATIONS_LABELS.manage.requests;

/** Demandes d'adhésion : en attente (approuver / refuser), puis les refusées en lecture seule. */
export function RequestsPanel({ pending, declined, disabled, onApprove, onDecline }: RequestsPanelProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const approve = async (member: OrganizationMember) => {
    setBusy(member.user_id);
    setError(null);
    try {
      await onApprove(member);
    } catch (failure) {
      setError(toManageErrorMessage(failure));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <section className={styles.panel} aria-labelledby="requests-pending-title">
        <h2 id="requests-pending-title">{text.pending}</h2>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {pending.length === 0 && <p className={styles.muted}>{text.empty}</p>}
        {pending.length > 0 && (
          <ul className={styles.rows}>
            {pending.map((member) => {
              const name = memberName(member);
              return (
                <li key={member.user_id} className={styles.row}>
                  <Avatar name={name} src={member.user.profile?.profile_picture ?? undefined} size={40} />
                  <span className={styles.identity}>
                    <span className={styles.name}>{name}</span>
                    <span className={styles.meta}>{text.asked(formatFullDate(member.created_at))}</span>
                  </span>
                  <span className={styles.buttons}>
                    <Button
                      variant="secondary"
                      disabled={disabled || busy !== null}
                      aria-label={text.declineOf(name)}
                      onClick={() => onDecline(member)}
                    >
                      {text.decline}
                    </Button>
                    <Button
                      disabled={disabled || (busy !== null && busy !== member.user_id)}
                      loading={busy === member.user_id}
                      loadingLabel={text.approving}
                      aria-label={text.approveOf(name)}
                      onClick={() => approve(member)}
                    >
                      {text.approve}
                    </Button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {declined.length > 0 && (
        <section className={styles.panel} aria-labelledby="requests-declined-title">
          <h2 id="requests-declined-title">{text.declinedTitle}</h2>
          <p className={styles.muted}>{text.declinedLead}</p>
          <ReadOnlyRows members={declined} />
        </section>
      )}
    </>
  );
}

/** Lignes sans action : demandes refusées, membres bannis. */
export function ReadOnlyRows({ members }: { members: OrganizationMember[] }) {
  return (
    <ul className={styles.rows}>
      {members.map((member) => {
        const name = memberName(member);
        return (
          <li key={member.user_id} className={`${styles.row} ${styles.past}`}>
            <Avatar name={name} src={member.user.profile?.profile_picture ?? undefined} size={40} />
            <span className={styles.identity}>
              <span className={styles.name}>{name}</span>
              <span className={styles.meta}>{formatFullDate(member.updated_at)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
