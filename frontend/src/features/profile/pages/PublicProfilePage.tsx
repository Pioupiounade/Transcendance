import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { getPublicProfile } from '../api/profileApi';
import type { PublicProfile } from '../types';
import { INTEREST_LABELS } from '../interestLabels';
import '../components/ProfileForm.css';

export function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(false);
    setProfile(null);

    if (!userId) {
      setError(true);
      setIsLoading(false);
      return;
    }

    getPublicProfile(userId)
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  if (isLoading) return <p role="status">Loading profile...</p>;
  if (error || !profile) return <p role="alert">Public profile unavailable.</p>;

    return (
    <section className="profile-page">
        <div className="card panel">
        <div className="header-actions" style={{ gap: '16px' }}>
            <div className="profile-avatar avatar">
            {profile.profilePicture ? (
                <img src={profile.profilePicture} alt={`${profile.username}'s avatar`} />
            ) : (
                <span>{profile.username.slice(0, 2).toUpperCase()}</span>
            )}
            </div>

            <div>
            <h1>@{profile.username}</h1>
            {profile.commune && <p className="help">{profile.commune}</p>}
            </div>
        </div>

        <section aria-labelledby="public-profile-about">
            <h2 id="public-profile-about">About</h2>
            <p>{profile.description || 'No description provided yet.'}</p>
        </section>

        <section aria-labelledby="public-profile-interests">
            <h2 id="public-profile-interests">Interests</h2>
            {profile.interests.length === 0 ? (
            <p>No interests selected yet.</p>
            ) : (
            <ul>
                {profile.interests.map((interest) => (
                <li key={interest}>{INTEREST_LABELS[interest]}</li>
                ))}
            </ul>
            )}
        </section>
        </div>
    </section>
    );
}