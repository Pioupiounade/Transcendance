import React, { useEffect, useState, useRef } from 'react';
import type { UserProfile, InterestCategory } from '../types';
import './ProfileForm.css';
import { INTEREST_LABELS } from '../interestLabels';

interface ProfileFormProps {
  initialData?: UserProfile;
  initialInterests?: InterestCategory[];
  onSave: (updatedProfile: UserProfile, selectedInterests: InterestCategory[], avatar: File | null) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,
  initialInterests = [],
  onSave,
  onCancel,
  isSaving = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [selectedInterests, setSelectedInterests] =
    useState<InterestCategory[]>(initialInterests);

  // Field-specific validation errors
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Inicia con los datos recibidos o valores por defecto
  const [formData, setFormData] = useState<UserProfile>(
    initialData || {
      username: '',
      location: null,
      description: '',
      visibility: 'PUBLIC',
      profilePicture: '',
    }
  );

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    let sanitizedValue = value;
    if (name === 'username') {
      setUsernameError(null);
      sanitizedValue = value
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 15);
    }

    setFormData({
      ...formData,
      [name]: sanitizedValue,
    });
  };

  const handleDetectLocation = () => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          location: { latitude, longitude },
        }));
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        setLocationError(
          err.code === 1
            ? 'Please allow access to your location to find nearby initiatives.'
            : 'Unable to retrieve location coordinates.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Invalid file format. Only JPG, PNG, and WebP are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image exceeds the 5 MB limit.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = previewUrl;
    setAvatar(file);
    setFormData((prev) => ({
      ...prev,
      profilePicture: previewUrl,
    }));
  };

  const toggleInterest = (interest: InterestCategory) => {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  };  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    setLocationError(null);

    let hasError = false;

    if (!/^[a-z0-9_]{4,15}$/.test(formData.username)) {
      setUsernameError('Username must be 4 to 15 characters (letters, numbers, _).');
      hasError = true;
    }

    if (!formData.location) {
      setLocationError('Please set your neighborhood to find nearby initiatives.');
      hasError = true;
    }

    if (hasError) return;

    onSave(formData, selectedInterests, avatar);
  };

  return (
    <main className="profile-page">
      <div className="card panel edit-fields">
        {/* Unified header: Avatar and title */}
        <div className="header-actions">
          <div
            className="profile-avatar avatar"
            onClick={() => fileInputRef.current?.click()}
            title="Click to change photo"
          >
            {formData.profilePicture ? (
              <img
                src={formData.profilePicture}
                alt="Profile preview"
                className="scene"
              />
            ) : (
              <span>{formData.username ? formData.username.slice(0, 2).toUpperCase() : 'AL'}</span>
            )}
          </div>

          <h1>Profile Settings</h1>
        </div>

        {avatarError && (
          <div className="help help--error">
            <span>{avatarError}</span>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarChange}
          accept="image/png, image/jpeg, image/webp"
          hidden
        />

        <form onSubmit={handleSubmit} noValidate>
          <p className="help">
            Fields marked with * are required.
          </p>

          {/* Username */}
          <label htmlFor="username">Username *</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="e.g. lennox_92"
          />
          {usernameError && (
            <div className="help help--error">
              <span>{usernameError}</span>
            </div>
          )}

          {/* Location */}
          <label htmlFor="neighborhood-btn">Neighborhood *</label>
          <div>
            <button
              type="button"
              id="neighborhood-btn"
              className="btn btn--secondary"
              onClick={handleDetectLocation}
              disabled={geoLoading}
            >
              {geoLoading ? 'Finding your area...' : '📍 Set my neighborhood'}
            </button>

            {formData.location && (
              <div className="form__ok">
                <span>✓ Neighborhood set</span>
              </div>
            )}
          </div>

          {locationError && (
            <div className="help help--error">
              <span>{locationError}</span>
            </div>
          )}

          {/* Visibility */}
          <label htmlFor="visibility">Profile Visibility</label>
          <select
            id="visibility"
            name="visibility"
            value={formData.visibility}
            onChange={handleChange}
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
            <option value="FRIENDS_ONLY">Friends Only</option>
          </select>

          {/* Description */}
          <label htmlFor="description">Description (Optional)</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            maxLength={300}
            placeholder="Tell us a little bit about yourself..."
          />
          <div className="help" style={{ justifyContent: 'flex-end' }}>
            <span>{formData.description ? formData.description.length : 0} / 300</span>
          </div>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend>Interests</legend>

            {(Object.keys(INTEREST_LABELS) as InterestCategory[]).map((interest) => (
              <label
                key={interest}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}
              >
                <input
                  type="checkbox"
                  checked={selectedInterests.includes(interest)}
                  onChange={() => toggleInterest(interest)}
                  disabled={isSaving}
                />
                {INTEREST_LABELS[interest]}
              </label>
            ))}
          </fieldset>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn--secondary btn--block"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary btn--block"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : initialData ? 'Save Changes' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default ProfileForm;