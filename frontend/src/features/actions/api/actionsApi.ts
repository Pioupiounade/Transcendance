import { http, ApiError } from '@/shared/api';
import type { Action, ActionRecord, ActionStatus, Category } from '../types';
import { MOCK_ACTIONS_DB } from './actionDetailMock';

const CATEGORY_MAP: Record<string, Category> = {
  environment: 'ENVIRONMENT',
  social: 'SOCIAL',
  cultural: 'CULTURAL',
};

/** Une action enrichie (`participant_count`, `remaining_seats`). 404 → `ApiError` status 404. */
export const fetchAction = (id: string, signal?: AbortSignal) => http.get<Action>(`/actions/${id}`, { signal });

/** Récupère la liste des actions. */
export const fetchActions = (signal?: AbortSignal) => http.get<Action[]>('/actions', { signal });

/** Body de `POST /actions` (`CreateActionDto`, docs/api_contract.md §15) : l'identité vient du JWT. */
export type CreateActionInput = {
  title: string;
  description: string;
  category: Category;
  /** `[latitude, longitude]`. */
  location: LatLng;
  /** Date ISO. */
  scheduled_at: string;
  /** ≥ 3 côté backend ; omis = sans limite. */
  max_participants?: number;
  organization_id?: number;
};

/** Crée une action (`PENDING`, créateur = utilisateur connecté). 401 → session expirée, 400/403 → refus métier. */
export const createAction = (input: CreateActionInput) => http.post<ActionRecord>('/actions', input);

/**
 * Body de `PATCH /actions/:id` (`UpdateActionDto`) : tout est facultatif, `max_participants` ne peut pas être
 * remis à « sans limite » (le DTO refuse `null`). L'organisation ne se change pas depuis le frontend.
 */
export type UpdateActionInput = Partial<Omit<CreateActionInput, 'organization_id'>>;

/** Modifie une action ouverte (créateur, ADMIN ou manager de l'organisation). 400 « can no longer be modified » sinon. */
export const updateAction = (id: string, input: UpdateActionInput) =>
  http.patch<ActionRecord>(`/actions/${id}`, input);

/** Annule une action `PENDING`/`APPROVED` (seule « suppression » offerte par l'API). */
export const cancelAction = (id: string) => http.patch<ActionRecord>(`/actions/${id}/cancel`);
