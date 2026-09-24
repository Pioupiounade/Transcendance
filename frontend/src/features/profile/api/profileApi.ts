import { useEffect, useState } from 'react';
import type { UserProfile } from '../types';

export const MOCK_USER_PROFILE: UserProfile = {
  id: 'usr-101',
  username: 'lennox_92',
  description: 'Passionate community organizer and eco-volunteer in Greenwood Park.',
  profilePicture:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  location: {
    latitude: 48.8566,
    longitude: 2.3522,
  },
  visibility: 'PUBLIC',
};

export async function getProfile(): Promise<UserProfile> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_USER_PROFILE;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    getProfile()
      .then((data) => {
        if (isMounted) setProfile(data);
      })
      .catch((err) => {
        if (isMounted) setError(err as Error);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { profile, isLoading, error, setProfile };
}