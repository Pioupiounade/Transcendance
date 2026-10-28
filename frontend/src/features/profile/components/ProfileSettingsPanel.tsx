import { useState } from 'react';
import { Button, ConfirmDialog, Icon, type Confirmation } from '@/shared/ui';
import { useResource } from '@/shared/hooks/useResource';
import {
  getNotificationPreferences,
  NOTIFICATION_LABELS,
  updateNotificationPreference,
  type NotificationType,
} from '../api/notificationsApi';
import { ownsActiveOrganization } from '../api/profileApi';
import { toProfileErrorMessage } from '../errors';
import { PROFILE_LABELS } from '../labels';
import panels from './ProfilePanels.module.css';
import styles from './ProfileSettingsPanel.module.css';

type ProfileSettingsPanelProps = {
  onDeactivateAccount: () => Promise<void>;
};

const text = PROFILE_LABELS.settings;

const NOTIFICATION_TYPES: readonly NotificationType[] = [
  'NEW_MESSAGE',
  'FRIEND_REQUEST',
  'ACTION_COMMENT',
  'ORGANIZATION_COMMENT',
  'ORGANIZATION_JOIN_REQUEST',
  'ACTION_STATUS_CHANGED',
  'ACTION_APPROVED',
  'ACTION_MIN_REACHED',
  'ACTION_MAX_REACHED',
  'ORGANIZATION_OWNERSHIP_TRANSFERRED',
  'ORGANIZATION_MEMBER_LEFT',
  'ORGANIZATION_ROLE_CHANGED',
  'ACTION_PARTICIPATION_CHANGED',
  'ORGANIZATION_MEMBERSHIP_ACTIVATED',
  'ORGANIZATION_JOIN_REQUEST_REJECTED',
  'ORGANIZATION_MEMBER_BANNED',
  'ORGANIZATION_MEMBER_REMOVED',
  'ORGANIZATION_COMMENT_DELETED',
];

type Preferences = Partial<Record<NotificationType, boolean>>;

const loadPreferences = async (signal: AbortSignal): Promise<Preferences> => {
  const rows = await getNotificationPreferences(signal);
  return Object.fromEntries(rows.map((row) => [row.type, row.enabled]));
};

/** Réglages : les notifications que je veux recevoir (interrupteurs), puis la désactivation du compte. */
export function ProfileSettingsPanel({ onDeactivateAccount }: ProfileSettingsPanelProps) {
  const preferences = useResource(loadPreferences);
  const ownership = useResource(ownsActiveOrganization);

  // Changements locaux par-dessus la réponse du serveur : la liste suit chaque bascule sans rechargement.
  const [changes, setChanges] = useState<Preferences>({});
  const [updating, setUpdating] = useState<NotificationType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const enabled = (type: NotificationType): boolean => changes[type] ?? preferences.data?.[type] ?? true;

  const toggle = async (type: NotificationType) => {
    const next = !enabled(type);
    setUpdating(type);
    setError(null);
    setChanges((current) => ({ ...current, [type]: next }));
    try {
      await updateNotificationPreference(type, next);
    } catch (failure) {
      setChanges((current) => ({ ...current, [type]: !next }));
      setError(toProfileErrorMessage(failure, text.updateFailed));
    } finally {
      setUpdating(null);
    }
  };

  const ownsOrganization = ownership.data === true;
  const canDeactivate = !ownership.loading && !ownership.error && !ownsOrganization;

  const askDeactivation = () =>
    setConfirmation({
      title: text.confirm.title,
      body: text.confirm.body,
      effects: text.confirm.effects,
      confirmLabel: text.confirm.confirmLabel,
      confirmingLabel: text.confirm.confirmingLabel,
      danger: true,
      run: onDeactivateAccount,
    });

  return (
    <div className={styles.layout}>
      <section className={panels.panel} aria-labelledby="settings-notifications-title">
        <h2 id="settings-notifications-title">{text.notifications}</h2>
        <p className={panels.muted}>{text.notificationsLead}</p>

        {preferences.loading && (
          <p className={panels.state} role="status">
            {text.notificationsLoading}
          </p>
        )}
        {preferences.error && (
          <p className={[panels.state, panels.error].join(' ')} role="alert">
            {text.notificationsError}
          </p>
        )}
        {error && (
          <p className={[panels.state, panels.error].join(' ')} role="alert">
            {error}
          </p>
        )}

        {!preferences.loading && !preferences.error && (
          <ul className={styles.switches}>
            {NOTIFICATION_TYPES.map((type) => (
              <li key={type}>
                <label className={styles.switch} htmlFor={`notify-${type}`}>
                  <span className={styles.switchLabel}>{NOTIFICATION_LABELS[type]}</span>
                  <input
                    id={`notify-${type}`}
                    type="checkbox"
                    role="switch"
                    className={styles.toggle}
                    checked={enabled(type)}
                    disabled={updating === type}
                    onChange={() => toggle(type)}
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={[panels.panel, styles.account].join(' ')} aria-labelledby="settings-account-title">
        <h2 id="settings-account-title">{text.account}</h2>
        <p className={panels.muted}>{text.accountLead}</p>

        {ownsOrganization && (
          <p className={panels.state} role="status">
            <Icon name="alert" size={14} strokeWidth={2.4} className={styles.noteIcon} />
            {text.ownsOrganization}
          </p>
        )}
        {ownership.error && (
          <p className={[panels.state, panels.error].join(' ')} role="alert">
            {text.ownershipCheckFailed}
          </p>
        )}

        <Button variant="secondary" className={styles.danger} onClick={askDeactivation} disabled={!canDeactivate}>
          {text.deactivate}
        </Button>
      </section>

      <ConfirmDialog
        confirmation={confirmation}
        onClose={() => setConfirmation(null)}
        cancelLabel={text.confirm.cancel}
        closeLabel={text.confirm.close}
        toErrorMessage={(failure) => toProfileErrorMessage(failure, text.updateFailed)}
      />
    </div>
  );
}
