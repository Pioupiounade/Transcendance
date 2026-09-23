/**
 * Mock API for fetching action details.
 *
 * This module provides a realistic mock implementation of the API contract
 * described in Section 2 of the specification. It includes a mock action
 * object, an async function that simulates a network request, and a custom
 * React hook for consuming the data in components.
 */

import { useEffect, useState } from 'react';
import type { ActionDetailData } from '../types';

/**
 * A realistic mock action object.
 *
 * All text is in English, dates are valid ISO‑8601 strings, three image URLs
 * are provided, and an organizer object is included.
 */
export const mockActionDetail: ActionDetailData = {
  id: 'action-123',
  title: 'Community Tree Planting',
  description:
    'Join us to plant trees in the local park and improve the environment.',
  category: 'environment',
  status: 'pending',
  locationName: 'Greenwood Park',
  // Use a date a few days in the future for realism
  scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  minParticipants: 5,
  maxParticipants: 30,
  currentParticipants: 12,
  images: [
    'https://example.com/images/tree-planting-1.jpg',
    'https://example.com/images/tree-planting-2.jpg',
    'https://example.com/images/tree-planting-3.jpg',
  ],
  organizer: {
    userId: 'user-456',
    name: 'Jane Doe',
    avatarUrl: 'https://example.com/avatars/jane-doe.jpg',
    organizationTitle: 'Eco Volunteers',
    organizationId: 'org-789',
  },
  // Optional fields are left undefined to reflect a not‑yet‑validated action
  validatedByUserId: undefined,
  validatedAt: undefined,
  organizationId: undefined,
};

/**
 * Simulate fetching an action by its identifier.
 *
 * The function introduces a brief artificial delay (500 ms) to mimic a real
 * network request and then resolves with the mock action data.
 *
 * @param id - The identifier of the action to fetch.
 * @returns A promise that resolves to an {@link ActionDetailData} object.
 */
export async function getActionById(id: string): Promise<ActionDetailData> {
  // In a real implementation the `id` would be used to request specific data.
  // Here we ignore it because we only have a single mock object.
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockActionDetail;
}

/**
 * Custom React hook for loading an action detail.
 *
 * The hook manages loading, success, and error states and returns an object
 * containing the current action data (or `null` while loading), a boolean flag
 * indicating whether the request is in progress, and any error that may have
 * occurred.
 *
 * @param actionId - The identifier of the action to load.
 * @returns An object with `action`, `isLoading`, and `error` properties.
 */
export function useActionDetail(actionId: string) {
  const [action, setAction] = useState<ActionDetailData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError(null);

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

    // Cleanup function to avoid state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [actionId]);

  return { action, isLoading, error };
}
