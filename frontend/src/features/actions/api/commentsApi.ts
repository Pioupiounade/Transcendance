import { http } from '@/shared/api';
import type { ActionComment } from '../types';

/** Commentaires d'une action, du plus récent au plus ancien (docs/api_contract.md §15). 404 → action inconnue. */
export const fetchComments = (actionId: string, signal?: AbortSignal) =>
  http.get<ActionComment[]>(`/actions/${actionId}/comments`, { signal });

/** Poste un commentaire (JWT) ; l'API renvoie le commentaire avec son auteur. */
export const postComment = (actionId: string, content: string) =>
  http.post<ActionComment>(`/actions/${actionId}/comments`, { content });
