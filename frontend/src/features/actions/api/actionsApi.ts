import { http, ApiError } from '@/shared/api';
import type { Action, ActionRecord, ActionStatus, Category } from '../types';
import { MOCK_ACTIONS_DB } from './actionDetailMock';

const CATEGORY_MAP: Record<string, Category> = {
  environment: 'ENVIRONMENT',
  social: 'SOCIAL',
  cultural: 'CULTURAL',
};

const STATUS_MAP: Record<string, ActionStatus> = {
  pending: 'PENDING',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
};

export const createAction = (record: ActionRecord, signal?: AbortSignal) =>
  http.post<ActionRecord>('/actions', record, { signal });

export async function fetchActions(signal?: AbortSignal): Promise<Action[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (signal?.aborted) throw new ApiError(0, []);

  return Object.values(MOCK_ACTIONS_DB).map((detail) => {
    const participantCount = detail.participants?.length ?? detail.currentParticipants;
    const remainingSeats = detail.maxParticipants ? Math.max(0, detail.maxParticipants - participantCount) : null;

    return {
      action_id: detail.id,
      title: detail.title,
      description: detail.description,
      creator_id: detail.organizer.userId,
      organization_id: detail.organizationId ?? null,
      min_participants: detail.minParticipants,
      max_participants: detail.maxParticipants,
      location: [48.8566, 2.3522],
      status: STATUS_MAP[detail.status] ?? 'PENDING',
      category: CATEGORY_MAP[detail.category] ?? 'ENVIRONMENT',
      imagesList: detail.images,
      validated_by_user_id: detail.validatedByUserId ?? null,
      validated_at: detail.validatedAt ?? null,
      scheduled_at: detail.scheduledAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      participant_count: participantCount,
      remaining_seats: remainingSeats,
    };
  });
}