import { useEffect, useState } from 'react';
import type { ActionDetailData, ActionPhoto } from '../types';

const TEST_IMAGES = [
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=80',
];

const beforePhotos = (sources: string[]): ActionPhoto[] => sources.map((src) => ({ src, phase: 'before' }));

export const MOCK_ACTIONS_DB: Record<string, ActionDetailData> = {
  // 1. APROBADA - Medio ambiente (Visible en el directorio)
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
    images: beforePhotos(TEST_IMAGES),
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
    validatedByUserId: 'usr-admin',
    validatedAt: '2026-09-22T10:00:00.000Z',
    organizationId: 'org-456',
  },

  // 2. COMPLETADA - Social (Visible en el directorio, plazas agotadas)
  'action-full': {
    id: 'action-full',
    title: 'Urban Gardening Workshop',
    description:
      'Learn how to grow your own vegetables and herbs in small urban spaces and balconies.',
    category: 'social',
    status: 'completed',
    locationName: 'North Community Center',
    scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    minParticipants: 4,
    maxParticipants: 15,
    currentParticipants: 15,
    images: beforePhotos([
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
    ]),
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
    validatedByUserId: 'usr-admin',
    validatedAt: '2026-09-20T14:00:00.000Z',
    organizationId: 'org-111',
  },

  // 3. APROBADA - Cultural (Visible en el directorio)
  'action-culture-1': {
    id: 'action-culture-1',
    title: 'Open Air Neighborhood Cinema',
    description:
      'Screening classic local short films followed by open debate and tea sharing.',
    category: 'cultural',
    status: 'approved',
    locationName: 'Place de la Mairie',
    scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    minParticipants: 10,
    maxParticipants: 50,
    currentParticipants: 24,
    images: beforePhotos([
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
    ]),
    organizer: {
      userId: 'usr-105',
      name: 'claire_cine',
      avatarUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      organizationTitle: 'Cinéma Quartier',
      organizationId: 'org-222',
    },
    participants: [],
    validatedByUserId: 'usr-admin',
    validatedAt: '2026-09-23T09:00:00.000Z',
    organizationId: 'org-222',
  },

  // 4. APROBADA - Social (Visible en el directorio)
  'action-social-repair': {
    id: 'action-social-repair',
    title: 'Community Bicycle Repair Cafe',
    description:
      'Bring your broken bike and learn how to fix flats, brakes, and chains with neighbor volunteers.',
    category: 'social',
    status: 'approved',
    locationName: 'Atelier Solidaire',
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    minParticipants: 3,
    maxParticipants: 12,
    currentParticipants: 8,
    images: beforePhotos([
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80',
    ]),
    organizer: {
      userId: 'usr-102',
      name: 'carlos_dev',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      organizationTitle: 'Cyclo-Entraide',
    },
    participants: [],
    validatedByUserId: 'usr-admin',
    validatedAt: '2026-09-24T11:00:00.000Z',
  },

  // 5. APROBADA - Medio ambiente (Visible en el directorio)
  'action-compost-day': {
    id: 'action-compost-day',
    title: 'Neighborhood Shared Compost Onboarding',
    description:
      'Discover how to contribute household biowaste and collect fertile compost for your plants.',
    category: 'environment',
    status: 'approved',
    locationName: 'Square Gustave Courbet',
    scheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    minParticipants: 5,
    maxParticipants: 20,
    currentParticipants: 6,
    images: beforePhotos([
      'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=800&auto=format&fit=crop&q=80',
    ]),
    organizer: {
      userId: 'usr-101',
      name: 'lennox_92',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      organizationTitle: 'Composteurs de Pantin',
    },
    participants: [],
    validatedByUserId: 'usr-admin',
    validatedAt: '2026-09-25T08:30:00.000Z',
  },

  // 6. COMPLETADA - Cultural (Visible en el directorio)
  'action-book-swap': {
    id: 'action-book-swap',
    title: 'Street Library Inauguration & Book Swap',
    description:
      'We painted and installed our new public birdhouse book exchange. Come trade a novel!',
    category: 'cultural',
    status: 'completed',
    locationName: 'Corner Rue de Paris',
    scheduledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    minParticipants: 2,
    maxParticipants: 25,
    currentParticipants: 20,
    images: beforePhotos([
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop&q=80',
    ]),
    organizer: {
      userId: 'usr-106',
      name: 'sophie_lecture',
      avatarUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
    participants: [],
    validatedByUserId: 'usr-admin',
    validatedAt: '2026-09-18T10:00:00.000Z',
  },

  // 7. PENDIENTE - En revisión de moderación (NO visible en la lista pública)
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
    currentParticipants: 1,
    images: beforePhotos(TEST_IMAGES),
    organizer: {
      userId: 'usr-101',
      name: 'lennox_92',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      organizationTitle: 'Eco Volunteers',
      organizationId: 'org-789',
    },
    participants: [],
    validatedByUserId: undefined,
    validatedAt: undefined,
    organizationId: undefined,
  },

  // 8. CANCELADA - Cancelada por el creador (NO visible en la lista pública)
  'action-cancelled': {
    id: 'action-cancelled',
    title: 'Neighborhood Flea Market (Vide-Grenier)',
    description:
      'Cancelled due to heavy storms forecasted throughout the entire weekend.',
    category: 'social',
    status: 'cancelled',
    locationName: 'Esplanade du Canal',
    scheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    minParticipants: 10,
    maxParticipants: 60,
    currentParticipants: 45,
    images: beforePhotos([
      'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&auto=format&fit=crop&q=80',
    ]),
    organizer: {
      userId: 'usr-102',
      name: 'carlos_dev',
    },
    participants: [],
    validatedByUserId: 'usr-admin',
    validatedAt: '2026-09-15T12:00:00.000Z',
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