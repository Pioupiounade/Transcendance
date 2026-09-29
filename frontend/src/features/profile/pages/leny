import React, { useState } from 'react';
import { useParams } from 'react-router';
import { CURRENT_USERNAME, useProfile } from '../api/profileApi';
import { ProfileView } from '../components/ProfileView';
import { ProfileForm } from '../components/ProfileForm';
import type { FriendshipStatus, UserProfile } from '../types';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const { profile, isLoading, error, setProfile } = useProfile(username);
  const [isEditing, setIsEditing] = useState(false);

  const isOwnProfile = !username || username === CURRENT_USERNAME;

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p className="help" style={{ justifyContent: 'center' }}>Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Profile not found</h2>
        <p className="help help--error" style={{ justifyContent: 'center' }}>
          Unable to load profile data.
        </p>
      </div>
    );
  }

  const handleSave = (updated: UserProfile) => {
    setProfile(updated);
    setIsEditing(false);
  };

  const handleDeleteAccount = () => {
    alert('Account deleted. (This is a placeholder action. Implement actual deletion logic.)');
  };

  const handleFriendshipChange = (newStatus: FriendshipStatus) => {
    setProfile((prev) => (prev ? { ...prev, friendshipStatus: newStatus } : null));
  };

  if (isEditing && isOwnProfile) {
    return (
      <ProfileForm
        initialData={profile}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <ProfileView
      profile={profile}
      isOwnProfile={isOwnProfile}
      onEdit={() => setIsEditing(true)}
      onDeleteAccount={handleDeleteAccount}
      onFriendshipChange={handleFriendshipChange}
    />
  );
};