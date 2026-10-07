import React, { useEffect, useState } from 'react';
import { selectInterest, removeInterest, useProfile, createProfile, updateProfile, getProfileActivity, getMyInterests } from '../api/profileApi';
import { useParams } from 'react-router';
import { ProfileView } from '../components/ProfileView';
import { ProfileForm } from '../components/ProfileForm';
import type { ProfileActivity, UserProfile, InterestCategory, FriendshipStatus } from '../types';
import { isApiError } from '@/shared/api';

export const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { profile, isLoading, error, setProfile } = useProfile(userId);
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
      const results = await Promise.allSettled(toSelect.map(selectInterest));

      try {
        setInterests(await getMyInterests());
      } catch {
        setInterestsError('Unable to reload interests. Please reload the page.');
        return;
      }

      if (results.some((result) => result.status === 'rejected')) {
        setInterestsError('Some interests could not be saved. Please reload the page.');
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

  if (isApiError(error) && error.status === 404 && !profile) {
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
  }

  const isOwnProfile = !userId;

  if (isOwnProfile && isApiError(error) && error.status === 404 && !profile) {
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

      const results = await Promise.allSettled(changes);

      try {
        setInterests(await getMyInterests());
      } catch {
        setInterestsError('Unable to reload interests. Please reload the page.');
        throw new Error('Unable to reload interests.');
      }

      if (results.some((result) => result.status === 'rejected')) {
        setUpdateError('Some interests could not be saved. Please try again.');
        return;
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

  const handleFriendshipChange = (newStatus: FriendshipStatus) => {
    setProfile((prev) => (prev ? { ...prev, friendshipStatus: newStatus } : null));
  };

  if (isEditing && isOwnProfile) {
    return (
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
    );
  }

  return (
    <ProfileView
      profile={profile}
      isOwnProfile={isOwnProfile}
      onEdit={() => setIsEditing(true)}
      //onDeleteAccount={handleDeleteAccount}
      onFriendshipChange={handleFriendshipChange}
      activity={activity}
      activityLoading={activityLoading}
      activityError={activityError}
      interests={interests}
      interestsLoading={interestsLoading}
      interestsError={interestsError}
    />
  );
};