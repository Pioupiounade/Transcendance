import { http } from '@/shared/api';
import type { MyParticipation } from '../types';

/** Mes participations (`PENDING`/`APPROVED`/`COMPLETED`, sans tri) ; 404 « User not found » → `[]`. */
export const fetchMyParticipations = (signal?: AbortSignal) =>
  http.list<MyParticipation>('/participations/me', { signal });
