import { http } from '@/shared/api';
import type { Action, ActionRecord, Category, LatLng } from '../types';

/** Toutes les actions, tous statuts (pas de filtre serveur par rayon : voir docs/api_contract.md §15). */
export const fetchActions = (signal?: AbortSignal) => http.list<Action>('/actions', { signal });

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
