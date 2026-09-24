import React, { useState, useRef } from 'react';
import type { ProfileActivity, UserProfile, InterestCategory } from '../types';
import { Link } from 'react-router';
import { INTEREST_LABELS } from '../interestLabels';

interface ProfileViewProps {
  profile: UserProfile;
  onEdit: () => void;
  onDeleteAccount?: () => Promise<void> | void;
  activity: ProfileActivity | null;
  activityLoading: boolean;
  activityError: string | null;
  interests: InterestCategory[];
  interestsLoading: boolean;
  interestsError: string | null;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  activity,
  activityLoading,
  activityError,
  interests,
  interestsLoading,
  interestsError,
  onEdit,
  onDeleteAccount,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  const openDeleteModal = () => {
    deleteDialogRef.current?.showModal();
  };

  const closeDeleteModal = () => {
    deleteDialogRef.current?.close();
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    try {
      await onDeleteAccount?.();
      closeDeleteModal();
    } catch (error) {
      console.error('Failed to delete account:', error);
      setIsDeleting(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="profile-page">
      <div className="card panel">
        {/* Profile header: Avatar, info, and edit action */}
        <div className="header-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="profile-avatar avatar">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt={`${profile.username}'s avatar`} />
              ) : (
                <span>{profile.username ? profile.username.slice(0, 2).toUpperCase() : 'AL'}</span>
              )}
            </div>

            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(1rem, 4vw, 1.5rem)', wordBreak: 'break-word' }}>
                @{profile.username}
                </h1>
                {profile.commune && (
                <p className="help" style={{ margin: '4px 0 0' }}>
                  {profile.commune}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            className="btn btn--secondary profile-edit-button"
            onClick={onEdit}
            aria-label="Edit profile"
          >
            <span className="btn-label">Edit Profile</span>
          </button>
        </div>

        {/* Bio / Description */}
        <div style={{ marginTop: '24px' }}>
          <label>About</label>
          <p style={{ marginTop: '8px', color: 'var(--text)' }}>
            {profile.description || 'No description provided yet.'}
          </p>
        </div>
        <section aria-labelledby="profile-interests-title" style={{ marginTop: '24px' }}>
          <h2 id="profile-interests-title">Interests</h2>

          {interestsLoading && <p role="status">Loading interests...</p>}
          {interestsError && <p role="alert">{interestsError}</p>}

          {!interestsLoading && !interestsError && (
            interests.length === 0 ? (
              <p>No interests selected yet.</p>
            ) : (
              <ul>
                {interests.map((interest) => (
                  <li key={interest}>{INTEREST_LABELS[interest]}</li>
                ))}
              </ul>
            )
          )}
        </section>
        {/* Activity */}
        <section
          aria-labelledby="profile-activity-title"
          style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--line)' }}
        >
          <h2 id="profile-activity-title">Activity</h2>

          {activityLoading && <p role="status">Loading activity...</p>}
          {activityError && <p role="alert">{activityError}</p>}
          {activity && <p>Points: {activity.points}</p>}
          {activity && (
            <div>
              <h3>Organizations</h3>
              {activity.organizations.length === 0 ? (
                <p>No organizations yet.</p>
              ) : (
                <ul>
                  {activity.organizations.map((organization) => (
                    <li key={organization.id}>{organization.title}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {activity && (
            <div>
              <h3>Actions participated in: {activity.participations.length}</h3>
              {activity.participations.length === 0 ? (
                <p>No actions yet.</p>
              ) : (
                <ul>
                  {activity.participations.map((participation) => (
                    <li key={participation.actionId}>
                      <Link to={`/actions/${encodeURIComponent(participation.actionId)}`}>
                      {participation.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
        {/* Danger Zone: Delete Account */}
        {onDeleteAccount && (
          <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--line)' }}>
            <label style={{ color: 'var(--danger)' }}>Danger Zone</label>
            <p className="help" style={{ margin: '6px 0 16px' }}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>

            <button
              type="button"
              className="btn btn--secondary"
              onClick={openDeleteModal}
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
            >
              Delete Account
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <dialog ref={deleteDialogRef} className="details-dialog">
        <button
          type="button"
          className="dialog-close"
          onClick={closeDeleteModal}
          aria-label="Close dialog"
        >
          &times;
        </button>

        <h2>Delete your account?</h2>
        <p className="help" style={{ margin: '12px 0 24px', fontSize: '14px' }}>
          Are you sure you want to permanently delete your account? All your data, neighborhood
          contributions, and profile details will be permanently removed.
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="btn btn--secondary btn--block"
            onClick={closeDeleteModal}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
          </button>
        </div>
      </dialog>
    </main>
  );
};