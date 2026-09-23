import { http } from '@/shared/api';
import type { Action } from '../types';

/** Toutes les actions, tous statuts (pas de filtre serveur par rayon : voir docs/api_contract.md §15). */
export const fetchActions = (signal?: AbortSignal) => http.list<Action>('/actions', { signal });
