/**
 * Mock API for fetching action details.
 *
 * This module provides realistic mock implementations covering multiple
 * action statuses ('approved', 'pending', 'completed') and returns them
 * dynamically based on the requested action ID.
 */

import { useEffect, useState } from 'react';
import type { ActionDetailData } from '../types';

/** Shared sample image URLs */
const TEST_IMAGES = [
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=80',
];

/**
 * Mock database records with various action states
 */
export const MOCK_ACTIONS_DB: Record<string, ActionDetailData> = {
  // 1. Pending action: Join button is disabled and status is pending
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
      userId: 'user-456',
      name: 'Jane Doe',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      organizationTitle: 'Eco Volunteers',
      organizationId: 'org-789',
    },
    validatedByUserId: undefined,
    validatedAt: undefined,
    organizationId: undefined,
  },

  // 2. Approved and verified action: Join button enabled with green verified badge
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
      userId: 'user-123',
      name: 'Maria Gonzalez',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      organizationTitle: 'EcoVolunteers',
      organizationId: 'org-456',
    },
    validatedByUserId: 'admin-001',
    validatedAt: '2026-09-22T10:00:00.000Z',
    organizationId: 'org-456',
  },

  // 3. Completed / Fully booked action: zero available spots left
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
      userId: 'user-789',
      name: 'Carlos Ruiz',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      organizationTitle: 'Neighborhood Gardens',
      organizationId: 'org-111',
    },
    validatedByUserId: 'admin-001',
    validatedAt: '2026-09-20T14:00:00.000Z',
    organizationId: 'org-111',
  },
};

/**
 * Simulates fetching an action by ID with network latency
 */
export async function getActionById(id: string): Promise<ActionDetailData> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_ACTIONS_DB[id] || MOCK_ACTIONS_DB['action-approved'];
}

/**
 * Custom React hook for fetching and managing action detail state
 */
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
