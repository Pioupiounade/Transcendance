import React, { useEffect, useState, useRef } from 'react';
import {
  getNotificationPreferences,
  updateNotificationPreference,
  NOTIFICATION_LABELS,
  type NotificationType,
} from '../api/notificationsApi';
import { isApiError } from '@/shared/api';
import styles from './ProfileSettingsPanel.module.css';
import { useMyMemberships } from '@/features/organizations/api/useMyMemberships';
import {
  MEMBER_STATUS,
  ORGANIZATION_STATUS,
  ROLE_ORG,
} from '@/features/organizations/types';

interface ProfileSettingsPanelProps {
  onDeactivateAccount: () => Promise<void> | void;
}

const FALLBACK_LABELS: Record<NotificationType, string> = {
  NEW_MESSAGE: 'New messages',
  FRIEND_REQUEST: 'Friend requests',
  ACTION_COMMENT: 'Action comments',
  ORGANIZATION_COMMENT: 'Organization comments',
  ORGANIZATION_JOIN_REQUEST: 'Organization requests',
  ACTION_STATUS_CHANGED: 'Action status updates',
  ACTION_APPROVED: 'Action approval',
  ACTION_MIN_REACHED: 'Minimum participants reached',
  ACTION_MAX_REACHED: 'Action full',
  ORGANIZATION_OWNERSHIP_TRANSFERRED: 'Organization ownership transferred to you',
};

export const ProfileSettingsPanel: React.FC<ProfileSettingsPanelProps> = ({
  onDeactivateAccount,
}) => {

  const {
   memberships,
   loading: membershipsLoading,
   error: membershipsError,
  } = useMyMemberships();

  const ownsActiveOrganization = memberships.some(
    (membership) =>
      membership.role === ROLE_ORG.OWNER &&
      membership.status === MEMBER_STATUS.ACTIVE &&
      membership.organization.organization_status === ORGANIZATION_STATUS.ACTIVE,
  );

  const [preferences, setPreferences] = useState<Record<NotificationType, boolean>>({
    ACTION_MIN_REACHED: true,
    ACTION_MAX_REACHED: true,
    ACTION_COMMENT: true,
    FRIEND_REQUEST: true,
    ORGANIZATION_JOIN_REQUEST: true,
    ORGANIZATION_COMMENT: true,
    ACTION_APPROVED: true,
    ACTION_STATUS_CHANGED: true,
    NEW_MESSAGE: true,
    ORGANIZATION_OWNERSHIP_TRANSFERRED: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [updatingType, setUpdatingType] = useState<NotificationType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let active = true;

    getNotificationPreferences()
      .then((data) => {
        if (!active) return;
        setPreferences((prev) => {
          const next = { ...prev };
          data.forEach((pref) => {
            next[pref.type] = pref.enabled;
          });
          return next;
        });
      })
      .catch(() => {
        if (active) setError('Unable to load notification settings.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleToggle = async (type: NotificationType) => {
    const nextVal = !preferences[type];
    setUpdatingType(type);
    setError(null);

    setPreferences((prev) => ({ ...prev, [type]: nextVal }));

    try {
      await updateNotificationPreference(type, nextVal);
    } catch (err) {
      setPreferences((prev) => ({ ...prev, [type]: !nextVal }));
      setError(
        isApiError(err) && err.messages.length > 0
          ? err.messages.join(' ')
          : 'Failed to update preference. Please try again.',
      );
    } finally {
      setUpdatingType(null);
    }
  };

  const handleConfirmDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await onDeactivateAccount();
      dialogRef.current?.close();
    } catch (err) {
      setError(
        isApiError(err) && err.messages.length > 0
          ? err.messages.join(' ')
          : 'Failed to deactivate account. Please try again.',
      );
    } finally {
      setIsDeactivating(false);
    }
  };

  const getLabel = (type: NotificationType): string => {
    const val = (NOTIFICATION_LABELS as Record<string, unknown>)[type];
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object' && 'label' in val) {
      return String((val as { label: unknown }).label);
    }
    return FALLBACK_LABELS[type] ?? type;
  };

  const notificationTypes: NotificationType[] = [
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
  ];

  return (
    <div className="card panel">
      <section className={styles.section} aria-labelledby="settings-notifications-title">
        <h2 id="settings-notifications-title" className={styles.title}>
          Notification Preferences
        </h2>
        <p className={styles.description}>
          Manage how and when you want to receive notifications.
        </p>

        {error && <p className="help help--error" role="alert">{error}</p>}
        {isLoading && <p className="help">Loading notification preferences...</p>}

        {!isLoading && (
          <div className={styles.optionsList}>
            {notificationTypes.map((type) => (
              <label key={type} className={styles.optionItem}>
                <input
                  type="checkbox"
                  checked={preferences[type] ?? true}
                  disabled={updatingType === type}
                  onChange={() => handleToggle(type)}
                />
                <span style={{ color: 'var(--ink, #263f36)', fontSize: '15px' }}>
                  {getLabel(type)}
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      <hr className={styles.divider} />

      <section className={styles.section} aria-labelledby="settings-account-title">
        <h2 id="settings-account-title" className={styles.titleDanger}>
          Danger Zone
        </h2>
        <p className={styles.description}>
          Deactivate your account. Your profile and actions will no longer be visible to others.
        </p>

        {ownsActiveOrganization && (
          <p className="help help--error" role="alert">
            Transfer ownership of your active organization before deactivating
            your account.
          </p>
        )}

        {membershipsError && (
          <p className="help help--error" role="alert">
            Unable to verify organization ownership. Please try again later.
          </p>
        )}

        <div className={styles.dangerActions}>
          <button
            type="button"
            className={`btn btn--secondary ${styles.btnDanger}`}
            disabled={
              membershipsLoading ||
              membershipsError !== null ||
              ownsActiveOrganization
            }
            onClick={() => dialogRef.current?.showModal()}
          >
            Deactivate Account
          </button>
        </div>
      </section>

      <dialog ref={dialogRef} className="details-dialog">
        <button
          type="button"
          className="dialog-close"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close dialog"
        >
          &times;
        </button>

        <h2 style={{ marginTop: 0 }}>Deactivate your account?</h2>
        <p className="help" style={{ margin: '12px 0 24px', fontSize: '14px' }}>
          Are you sure you want to deactivate your account? Your profile will be hidden from the neighborhood.
        </p>

        {error && (
          <p className="help help--error" role="alert" style={{ marginBottom: '12px' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="btn btn--secondary btn--block"
            onClick={() => dialogRef.current?.close()}
            disabled={isDeactivating}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={handleConfirmDeactivate}
            disabled={
              isDeactivating ||
              membershipsLoading ||
              membershipsError !== null ||
              ownsActiveOrganization
            }
            style={{ backgroundColor: 'var(--danger, #dc2626)', borderColor: 'var(--danger, #dc2626)' }}
          >
            {isDeactivating ? 'Deactivating...' : 'Yes, Deactivate'}
          </button>
        </div>
      </dialog>
    </div>
  );
};