import React, { useEffect, useState } from 'react';
import {
  selectInterest,
  removeInterest,
  useProfile,
  createProfile,
  updateProfile,
  getProfileActivity,
  getMyInterests,
  deactivateAccount,
} from '../api/profileApi';
import { ProfileView } from '../components/ProfileView';
import { ProfileForm } from '../components/ProfileForm';
import { ProfileSettingsPanel } from '../components/ProfileSettingsPanel';
import { ProfileTabs } from '../components/ProfileTabs';
import { PROFILE_TABS, profilePanelId, profileTabId, type ProfileTabId } from '../profileTabIds';
import type { ProfileActivity, UserProfile, InterestCategory } from '../types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { isApiError } from '@/shared/api';

export const ProfilePage: React.FC = () => {
  const { logout } = useAuth();
  const { profile, isLoading, error, setProfile } = useProfile();
  const [activeTab, setActiveTab] = useState<ProfileTabId>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activity, setActivity] = useState<ProfileActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [interests, setInterests] = useState<InterestCategory[]>([]);
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [interestsError, setInterestsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getMyInterests()
      .then((data) => {
        if (active) setInterests(data);
      })
      .catch(() => {
        if (active) setInterestsError('Unable to load interests.');
      })
      .finally(() => {
        if (active) setInterestsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getProfileActivity()
      .then((data) => {
        if (active) setActivity(data);
      })
      .catch(() => {
        if (active) setActivityError('Unable to load profile activity.');
      })
      .finally(() => {
        if (active) setActivityLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (
    values: UserProfile,
    selectedInterests: InterestCategory[],
    avatar: File | null,
  ) => {
    if (isSaving) return;

    setIsSaving(true);
    setCreateError(null);

    try {
      const savedProfile = await createProfile(values, avatar);
      setProfile(savedProfile);
      setIsCreating(false);

      const toSelect = selectedInterests.filter(
        (interest) => !interests.includes(interest),
      );
      await Promise.allSettled(toSelect.map(selectInterest));

      try {
        setInterests(await getMyInterests());
      } catch {
        setInterestsError('Unable to reload interests. Please reload the page.');
        return;
      }
    } catch (failure) {
      setCreateError(
        isApiError(failure) && failure.messages.length > 0
          ? failure.messages.join(' ')
          : 'Unable to create your profile.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p className="help" style={{ justifyContent: 'center' }}>Loading profile...</p>
      </div>
    );
  }

  if (isCreating) {
    return (
      <>
        {createError && <p role="alert">{createError}</p>}
        <ProfileForm
          onSave={handleCreate}
          onCancel={() => setIsCreating(false)}
          isSaving={isSaving}
          initialInterests={interests}
        />
      </>
    );
  }

  if (!error && !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>No profile yet</h2>
        <p>Your account does not have a profile yet.</p>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          disabled={interestsLoading}
        >
          Create profile
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Profile not found</h2>
        <p className="help help--error" style={{ justifyContent: 'center' }}>
          Unable to load profile data.
        </p>
      </div>
    );
  }

  const handleSave = async (
    updated: UserProfile,
    selectedInterests: InterestCategory[],
    avatar: File | null,
  ) => {
    if (isSaving) return;

    if (interestsLoading || interestsError) {
      setUpdateError('Interests are unavailable. Please reload the page.');
      return;
    }

    setIsSaving(true);
    setUpdateError(null);

    try {
      const savedProfile = await updateProfile(updated, avatar);
      setProfile(savedProfile);

      const changes = [
        ...selectedInterests
          .filter((interest) => !interests.includes(interest))
          .map(selectInterest),
        ...interests
          .filter((interest) => !selectedInterests.includes(interest))
          .map(removeInterest),
      ];

      await Promise.allSettled(changes);

      try {
        setInterests(await getMyInterests());
      } catch {
        setInterestsError('Unable to reload interests. Please reload the page.');
        throw new Error('Unable to reload interests.');
      }

      setIsEditing(false);
    } catch (failure) {
      setUpdateError(
        isApiError(failure) && failure.messages.length > 0
          ? failure.messages.join(' ')
          : 'Unable to save your profile or interests.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    await deactivateAccount();
    try {
      await logout();
    } catch {
      // Ignorar fallo de sesión ya revocada en el backend
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p className="help" style={{ justifyContent: 'center' }}>Loading profile...</p>
      </div>
    );
  }

  if (isCreating) {
    return (
      <>
        {createError && <p role="alert">{createError}</p>}
        <ProfileForm
          onSave={handleCreate}
          onCancel={() => setIsCreating(false)}
          isSaving={isSaving}
          initialInterests={interests}
        />
      </>
    );
  }

  if (!error && !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>No profile yet</h2>
        <p>Your account does not have a profile yet.</p>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          disabled={interestsLoading}
        >
          Create profile
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Profile not found</h2>
        <p className="help help--error" style={{ justifyContent: 'center' }}>
          Unable to load profile data.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ProfileTabs
          tabs={PROFILE_TABS}
          value={activeTab}
          onChange={(tab) => {
            setIsEditing(false);
            setActiveTab(tab);
          }}
        />
      </div>

      <div
        role="tabpanel"
        id={profilePanelId('overview')}
        aria-labelledby={profileTabId('overview')}
        hidden={activeTab !== 'overview'}
        style={{ marginTop: '1.5rem' }}
      >
        {activeTab === 'overview' && (
          isEditing ? (
            <>
              {updateError && <p role="alert">{updateError}</p>}
              <ProfileForm
                initialData={profile}
                initialInterests={interests}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
                isSaving={isSaving}
              />
            </>
          ) : (
            <ProfileView
              profile={profile}
              isOwnProfile={true}
              onEdit={() => setIsEditing(true)}
              onFriendshipChange={() => { }}
              activity={activity}
              activityLoading={activityLoading}
              activityError={activityError}
              interests={interests}
              interestsLoading={interestsLoading}
              interestsError={interestsError}
            />
          )
        )}
      </div>

      <div
        role="tabpanel"
        id={profilePanelId('settings')}
        aria-labelledby={profileTabId('settings')}
        hidden={activeTab !== 'settings'}
        style={{ marginTop: '1.5rem' }}
      >
        {activeTab === 'settings' && (
          <ProfileSettingsPanel onDeactivateAccount={handleDeactivate} />
        )}
      </div>
    </div>
  );
};