import React, { useState, useRef } from 'react';
import type { UserProfile } from '../types/profile';

export const ProfileForm = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Field-specific validation errors
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UserProfile>({
    username: '',
    location: null,
    description: '',
    visibility: 'PUBLIC',
    profilePicture: '',
  });

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
            ? 'Please allow to access your location to find nearby initiatives.'
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

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image exceeds the 2 MB limit.');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      profilePicture: URL.createObjectURL(file),
    }));
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

    const payload = {
      ...formData,
      location: `POINT(${formData.location.longitude} ${formData.location.latitude})`,
    };

    console.log('Payload ready for PostGIS:', payload);
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

          <div className="form__submit">
            <button type="submit" className="btn btn--primary btn--block btn--l">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};