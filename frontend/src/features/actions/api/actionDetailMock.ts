import { useEffect, useState } from 'react';
import type { ActionDetailData } from '../types';

const TEST_IMAGES = [
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=80',
];

export const MOCK_ACTIONS_DB: Record<string, ActionDetailData> = {
  'action-123': {
    id: 'action-123',
    title: 'Community Tree Planting',
    description:
      'Join us to plant trees in the local park and improve the environment.',
    category: 'environment',
    status: 'pending',
    locationName: 'Greenwood Park',
    scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    minParticipants: 5,
    maxParticipants: 30,
    currentParticipants: 12,
    images: TEST_IMAGES,
    organizer: {
      userId: 'usr-101',
      name: 'lennox_92',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      organizationTitle: 'Eco Volunteers',
      organizationId: 'org-789',
    },
    participants: [
      {
        userId: 'usr-102',
        name: 'carlos_dev',
        avatarUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
      {
        userId: 'usr-103',
        name: 'leslie_curie',
        avatarUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      },
    ],
    validatedByUserId: undefined,
    validatedAt: undefined,
    organizationId: undefined,
  },

  'action-approved': {
    id: 'action-approved',
    title: 'Green River Clean-up Day',
    description:
      'Join the local clean-up effort along Green River to protect local biodiversity. Gloves and trash bags provided.',
    category: 'environment',
    status: 'approved',
    locationName: 'Green River National Park',
    scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    minParticipants: 5,
    maxParticipants: 30,
    currentParticipants: 12,
    images: TEST_IMAGES,
    organizer: {
      userId: 'usr-103',
      name: 'leslie_curie',
      avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      organizationTitle: 'EcoVolunteers',
      organizationId: 'org-456',
    },
    participants: [
      {
        userId: 'usr-101',
        name: 'lennox_92',
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      {
        userId: 'usr-102',
        name: 'carlos_dev',
        avatarUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
    ],
    validatedByUserId: 'usr-101',
    validatedAt: '2026-09-22T10:00:00.000Z',
    organizationId: 'org-456',
  },

  'action-full': {
    id: 'action-full',
    title: 'Urban Gardening Workshop',
    description:
      'Learn how to grow your own vegetables and herbs in small urban spaces and balconies.',
    category: 'social',
    status: 'completed',
    locationName: 'North Community Center',
    scheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    minParticipants: 4,
    maxParticipants: 15,
    currentParticipants: 15,
    images: TEST_IMAGES,
    organizer: {
      userId: 'usr-102',
      name: 'carlos_dev',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      organizationTitle: 'Neighborhood Gardens',
      organizationId: 'org-111',
    },
    participants: [
      {
        userId: 'usr-101',
        name: 'lennox_92',
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      {
        userId: 'usr-103',
        name: 'leslie_curie',
        avatarUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      },
    ],
    validatedByUserId: 'usr-101',
    validatedAt: '2026-09-20T14:00:00.000Z',
    organizationId: 'org-111',
  },
};

export async function getActionById(id: string): Promise<ActionDetailData> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const action = MOCK_ACTIONS_DB[id];

  if (!action) {
    throw new Error(`Action not found: ${id}`);
  }

  return action;
}

export function useActionDetail(actionId: string) {
  const [action, setAction] = useState<ActionDetailData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    getActionById(actionId)
      .then((data) => {
        if (isMounted) {
          setAction(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err as Error);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [actionId]);

  return { action, isLoading, error };
}