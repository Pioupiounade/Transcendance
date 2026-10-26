import { Button, Icon, type IconName } from '@/shared/ui';
import { PROFILE_LABELS } from '../labels';
import styles from './ProfileUnavailable.module.css';

export type UnavailableReason = keyof typeof PROFILE_LABELS.unavailable;

type ProfileUnavailableProps = {
  reason: UnavailableReason;
  /** Erreur de chargement : proposer de réessayer. */
  onRetry?: () => void;
};

const ICONS: Record<UnavailableReason, IconName> = {
  PROFILE_UNAVAILABLE: 'user',
  ACCOUNT_DEACTIVATED: 'user',
  ACCOUNT_SUSPENDED: 'alert',
  PRIVATE: 'lock',
  ERROR: 'alert',
};

/** Un seul écran pour tous les profils qu'on ne peut pas montrer : privé, désactivé, suspendu, introuvable, erreur. */
export function ProfileUnavailable({ reason, onRetry }: ProfileUnavailableProps) {
  const text = PROFILE_LABELS.unavailable[reason];
  return (
    <section className={styles.wrap} aria-labelledby="profile-unavailable-title">
      <span className={styles.icon}>
        <Icon name={ICONS[reason]} size={28} />
      </span>
      <h1 id="profile-unavailable-title" className={styles.title}>
        {text.title}
      </h1>
      <p className={styles.body}>{text.body}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {PROFILE_LABELS.retry}
        </Button>
      )}
    </section>
  );
}
