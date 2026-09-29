import { useEffect, useState } from 'react';
import type { FriendshipStatus, UserProfile } from '../types';

//user that is logged in currently 
export const CURRENT_USER_ID = 'usr-101';
export const CURRENT_USERNAME = 'lennox_92';

export const MOCK_USER_PROFILES: UserProfile[] = [
  // 1. Perfil Propio (Usuario en sesión)
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
    friendshipStatus: undefined,
  },

  // 2. Sin relación previa -> Mostrar botón [Add Friend]
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
    friendshipStatus: 'NONE',
  },

  // 3. Amistad activa confirmada -> Mostrar [Friends ✓]
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
    friendshipStatus: 'ACCEPTED',
  },

  // 4. Solicitud enviada por mí en espera -> Mostrar [Request Sent]
  {
    id: 'usr-104',
    username: 'claire_cine',
    description: 'Local filmmaker promoting neighborhood open-air cinema projections.',
    profilePicture:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    location: {
      latitude: 48.8529,
      longitude: 2.3499,
    },
    visibility: 'PUBLIC',
    friendshipStatus: 'PENDING_SENT',
  },

  // 5. Solicitud recibida por el usuario en sesión -> Mostrar [Accept] y [Decline]
  {
    id: 'usr-105',
    username: 'marc_brico',
    description: 'Handyman and DIY enthusiast running the local bicycle repair cafe.',
    profilePicture:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    location: {
      latitude: 48.8655,
      longitude: 2.3789,
    },
    visibility: 'PUBLIC',
    friendshipStatus: 'PENDING_RECEIVED',
  },

  // 6. Usuario bloqueado -> Estado de exclusión
  {
    id: 'usr-106',
    username: 'sophie_lecture',
    description: 'Street book-box manager and neighborhood reading club organizer.',
    profilePicture:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    location: {
      latitude: 48.8598,
      longitude: 2.3412,
    },
    visibility: 'PUBLIC',
    friendshipStatus: 'BLOCKED',
  },
];

export const MOCK_USER_PROFILE = MOCK_USER_PROFILES[0];

export async function getProfile(usernameOrId?: string): Promise<UserProfile> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!usernameOrId || usernameOrId === CURRENT_USERNAME || usernameOrId === CURRENT_USER_ID) {
    return { ...MOCK_USER_PROFILES[0] };
  }

  const found = MOCK_USER_PROFILES.find(
    (p) => p.id === usernameOrId || p.username === usernameOrId
  );

  if (!found) {
    throw new Error(`Profile not found: ${usernameOrId}`);
  }

  return { ...found };
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return [...MOCK_USER_PROFILES];
}

export async function sendFriendRequest(targetUserId: string): Promise<FriendshipStatus> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const user = MOCK_USER_PROFILES.find((p) => p.id === targetUserId);
  if (user) {
    user.friendshipStatus = 'PENDING_SENT';
  }
  return 'PENDING_SENT';
}

export async function acceptFriendRequest(targetUserId: string): Promise<FriendshipStatus> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const user = MOCK_USER_PROFILES.find((p) => p.id === targetUserId);
  if (user) {
    user.friendshipStatus = 'ACCEPTED';
  }
  return 'ACCEPTED';
}

export async function declineFriendRequest(targetUserId: string): Promise<FriendshipStatus> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const user = MOCK_USER_PROFILES.find((p) => p.id === targetUserId);
  if (user) {
    user.friendshipStatus = 'NONE';
  }
  return 'NONE';
}

export async function cancelOrRemoveFriend(targetUserId: string): Promise<FriendshipStatus> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const user = MOCK_USER_PROFILES.find((p) => p.id === targetUserId);
  if (user) {
    user.friendshipStatus = 'NONE';
  }
  return 'NONE';
}

export async function unblockUser(targetUserId: string): Promise<FriendshipStatus> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const user = MOCK_USER_PROFILES.find((p) => p.id === targetUserId);
  if (user) {
    user.friendshipStatus = 'NONE';
  }
  return 'NONE';
}

export function useProfile(identifier?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }
    });

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