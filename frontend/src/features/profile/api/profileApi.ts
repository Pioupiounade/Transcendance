import { useEffect, useState } from 'react';
import type { UserProfile } from '../types';

export const MOCK_USER_PROFILES: UserProfile[] = [
  {
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
  },
  {
    id: 'usr-102',
    username: 'carlos_dev',
    description: 'Full-stack developer, retro gamer, and pong master.',
    profilePicture:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    location: {
      latitude: 48.8584,
      longitude: 2.2945,
    },
    visibility: 'PUBLIC',
  },
  {
    id: 'usr-103',
    username: 'leslie_curie',
    description: 'UX designer, digital artist and UI enthusiast.',
    profilePicture:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    location: {
      latitude: 48.8606,
      longitude: 2.3376,
    },
    visibility: 'PUBLIC',
  },
];

export const MOCK_USER_PROFILE = MOCK_USER_PROFILES[0];

export async function getProfile(usernameOrId?: string): Promise<UserProfile> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!usernameOrId) return MOCK_USER_PROFILES[0];

  const found = MOCK_USER_PROFILES.find(
    (p) => p.id === usernameOrId || p.username === usernameOrId
  );

  if (!found) {
    throw new Error(`Profile not found: ${usernameOrId}`);
  }

  return found;
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_USER_PROFILES;
}

export function useProfile(identifier?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getProfile(identifier)
      .then((data) => {
        if (isMounted) setProfile(data);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err as Error);
          setProfile(null);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [identifier]);

  return { profile, isLoading, error, setProfile };
}