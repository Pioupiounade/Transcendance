import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/features/auth';
import { getProfile } from '../api/profileApi';

export function RequireProfile() {
  const { status } = useAuth();

  const [checking, setChecking] = useState(status === 'authenticated');
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') {
      setChecking(false);
      setHasProfile(null);
      return;
    }

    let active = true;

    setChecking(true);

    getProfile()
      .then((profile) => {
        if (!active) return;
        setHasProfile(profile !== null);
      })
      .catch(() => {
        if (!active) return;
        setHasProfile(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [status]);

  // Les visiteurs anonymes peuvent toujours consulter les routes publiques.
  if (status !== 'authenticated') {
    return <Outlet />;
  }

  if (checking) {
    return <p role="status">Loading your profile…</p>;
  }

  if (!hasProfile) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}