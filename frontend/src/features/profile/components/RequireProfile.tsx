import { useCallback } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/features/auth';
import { useResource } from '@/shared/hooks/useResource';
import { getProfile } from '../api/profileApi';
import { PROFILE_LABELS } from '../labels';
import styles from './RequireProfile.module.css';

type RequireProfileProps = {
  /** Page du profil personnel, où l'on envoie un compte qui n'a pas encore de profil. */
  profilePath: string;
};

const NO_PROFILE = Promise.resolve(null);

/** Garde : un connecté sans profil est renvoyé créer le sien ; les visiteurs anonymes passent. */
export function RequireProfile({ profilePath }: RequireProfileProps) {
  const { status } = useAuth();
  const authenticated = status === 'authenticated';
  const load = useCallback((signal: AbortSignal) => (authenticated ? getProfile(signal) : NO_PROFILE), [authenticated]);
  const { data, loading, error } = useResource(load);

  if (!authenticated) return <Outlet />;
  if (loading) {
    return (
      <p role="status" className={styles.checking}>
        {PROFILE_LABELS.loading}
      </p>
    );
  }
  if (error || data === null) return <Navigate to={profilePath} replace />;
  return <Outlet />;
}
