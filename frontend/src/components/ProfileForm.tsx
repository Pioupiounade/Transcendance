import React, { useState } from 'react';
import type { UserProfile } from '../types/profile';

export const ProfilePage = () => {
  // Local state holding the profile form data
  const [formData, setFormData] = useState<UserProfile>({
    username: '',
    location: '',
    bio: '',
    profileType: 'CITIZEN',
  });

  // Handle inputs, select, and textarea updates
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Ready to send to backend API:', formData);
    alert(`Profile saved for @${formData.username}`);
  };

  return (
    <main className="profile-page">
      {/* 1. Top Cover Banner */}
      <div className="profile-cover">
        <div className="scene" />
      </div>

      {/* 2. Header with Avatar & User Intro */}
      <div className="profile-head">
        <div className="profile-avatar avatar">
          AL
        </div>
        <div className="profile-name">
          <h1>My Profile</h1>
        </div>
        <p>Manage your account info and neighborhood preferences.</p>
      </div>

      {/* 3. Main Form Container */}
      <div style={{ marginTop: '24px', maxWidth: '640px', margin: '24px auto 0' }}>
        <form onSubmit={handleSubmit} className="panel edit-fields">
          <h2>Edit Profile</h2>
          <p style={{ marginBottom: '16px', color: 'var(--muted)' }}>
            Fields marked with * are required.
          </p>

          {/* Username (Required & Unique) */}
          <label htmlFor="username">Username *</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="e.g. lennox"
          />

          {/* Location (Required & Private) */}
          <label htmlFor="location">Location *</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            placeholder="e.g. Montmartre, Paris"
          />
          <div className="help" style={{ marginTop: '4px' }}>
            <svg className="ic" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>

          {/* Profile Role */}
          <label htmlFor="profileType">Neighborhood Role</label>
          <select
            id="profileType"
            name="profileType"
            value={formData.profileType}
            onChange={handleChange}
          >
            <option value="CITIZEN">Citizen</option>
            <option value="ASSOCIATION">Association</option>
            <option value="MERCHANT">Merchant</option>
          </select>

          {/* Bio (Optional) */}
          <label htmlFor="bio">Bio (Optional)</label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            placeholder="Tell us a little bit about yourself..."
          />

          {/* Submit Button */}
          <div style={{ marginTop: '24px' }}>
            <button type="submit" className="btn btn--primary btn--block btn--l">
              Save
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};