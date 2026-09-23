import React, { useState } from 'react';
import { useProfile } from '../api/profileApi';
import { ProfileView } from '../components/ProfileView';
import { ProfileForm } from '../components/ProfileForm';
import type { UserProfile } from '../types';

export const ProfilePage: React.FC = () => {
  const { profile, isLoading, error, setProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);

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
        <p className="help help--error" style={{ justifyContent: 'center' }}>Unable to load profile data.</p>
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

  if (isEditing) {
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
      onEdit={() => setIsEditing(true)}
      onDeleteAccount={handleDeleteAccount}
    />
  );
};