import { http } from '@/shared/api';
import type { MyParticipation } from '../types';

/** Mes participations (`PENDING`/`APPROVED`/`COMPLETED`, sans tri) ; 404 « User not found » → `[]`. */
export type ActionParticipantApi = {
  user_id: string;
  username: string | null;
  profile_picture: string | null;
  created_at: string;
};

export const fetchMyParticipations = (signal?: AbortSignal) =>
  http.list<MyParticipation>('/participations/me', { signal });

export const fetchActionParticipants = (
  actionId: string,
  signal?: AbortSignal,
) =>
  http.list<ActionParticipantApi>(
    `/participations/action/${actionId}`,
    { signal },
  );

export const joinAction = (actionId: string) =>
  http.post(`/participations/${actionId}`, {});

export const leaveAction = (actionId: string) =>
  http.delete(`/participations/${actionId}`);