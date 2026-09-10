import React, { useState } from 'react';
import type { UserProfile } from '../types/profile';
import './ProfileForm.css';

export const ProfileForm = () => {
  const [formData, setFormData] = useState<UserProfile>({
    username: '',
    email: '',
    bio: '',
    profileType: 'CITIZEN',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Datos listos para enviar al backend:', formData);
    alert('Perfil guardado localmente');
  };

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <h2>Create / Edit Profile</h2>

      <div className="form-group">
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="profileType">Profile Type:</label>
        <select
          id="profileType"
          name="profileType"
          value={formData.profileType}
          onChange={handleChange}
          className="form-input"
        >
          <option value="CITIZEN">Citizen</option>
          <option value="ASSOCIATION">Association</option>
          <option value="MERCHANT">Merchant</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="bio">Bio:</label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={3}
          className="form-input"
        />
      </div>

      <button type="submit" className="form-button">
        Save Profile
      </button>
    </form>
  );
};