import React, { useState, useRef } from 'react';
import type { UserProfile, FriendshipStatus } from '../types';
import { FriendshipCTA } from './FriendshipCTA';
import './ProfileForm.css';

interface ProfileViewProps {
  profile: UserProfile;
  isOwnProfile?: boolean;
  onEdit: () => void;
  onDeleteAccount: () => Promise<void> | void;
  onFriendshipChange?: (newStatus: FriendshipStatus) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  isOwnProfile = false,
  onEdit,
  onDeleteAccount,
  onFriendshipChange,
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
      await onDeleteAccount();
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
        {/* Profile header: Avatar, info, and contextual actions */}
        <div
          className="header-actions"
          style={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="profile-avatar avatar">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt={`${profile.username}'s avatar`} />
              ) : (
                <span>{profile.username ? profile.username.slice(0, 2).toUpperCase() : 'AL'}</span>
              )}
            </div>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
                  wordBreak: 'break-word',
                }}
              >
                @{profile.username}
              </h1>
              {profile.location && (
                <p
                  className="help"
                  style={{ margin: '4px 0 0', color: '#16a34a', fontWeight: 500 }}
                >
                  ✓ Neighborhood verified
                </p>
              )}
            </div>
          </div>

          {/* Action button: Edit profile for owner, Friendship CTA for others */}
          {isOwnProfile ? (
            <button
              type="button"
              className="btn btn--secondary profile-edit-button"
              onClick={onEdit}
              aria-label="Edit profile"
            >
              <span className="btn-label">Edit Profile</span>
            </button>
          ) : (
            <FriendshipCTA
              userId={profile.id}
              status={profile.friendshipStatus ?? 'NONE'}
              onStatusChange={onFriendshipChange}
            />
          )}
        </div>

        {/* Bio / Description */}
        <div style={{ marginTop: '16px' }}>
          <label>About</label>
          <p style={{ marginTop: '8px', color: 'var(--ink, #334155)', lineHeight: 1.5 }}>
            {profile.description || 'No description provided yet.'}
          </p>
        </div>

        {/* Danger Zone: Only accessible to the profile owner */}
        {isOwnProfile && (
          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid var(--line, #e2e8f0)',
            }}
          >
            <label style={{ color: '#dc2626' }}>Danger Zone</label>
            <p className="help" style={{ margin: '6px 0 16px' }}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>

            <button
              type="button"
              className="btn btn--secondary"
              onClick={openDeleteModal}
              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
            >
              Delete Account
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {isOwnProfile && (
        <dialog ref={deleteDialogRef} className="details-dialog">
          <button
            type="button"
            className="dialog-close"
            onClick={closeDeleteModal}
            aria-label="Close dialog"
          >
            &times;
          </button>

          <h2 style={{ marginTop: 0 }}>Delete your account?</h2>
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
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
            </button>
          </div>
        </dialog>
      )}
    </main>
  );
};