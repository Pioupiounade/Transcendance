import { useCallback, useState } from 'react';
import { useResource } from '@/shared/hooks/useResource';
import type { ActionComment } from '../types';
import { fetchComments } from './commentsApi';

type Posted = { actionId: string; items: ActionComment[] };

/**
 * Commentaires d'une action, du plus récent au plus ancien, avec `prepend` pour insérer en tête ce que
 * l'on vient de poster sans recharger. `reload` repart de l'API. Remplaçable par TanStack Query.
 */
export function useActionComments(actionId: string) {
  const load = useCallback((signal: AbortSignal) => fetchComments(actionId, signal), [actionId]);
  const { data, loading, error, reload: reloadResource } = useResource(load);
  const [posted, setPosted] = useState<Posted>({ actionId, items: [] });

  const prepend = useCallback(
    (comment: ActionComment) =>
      setPosted((previous) => ({
        actionId,
        items: [comment, ...(previous.actionId === actionId ? previous.items : [])],
      })),
    [actionId],
  );
  const reload = useCallback(() => {
    setPosted({ actionId, items: [] });
    reloadResource();
  }, [actionId, reloadResource]);

  const fresh = posted.actionId === actionId ? posted.items : [];
  const freshIds = new Set(fresh.map((comment) => comment.comment_id));
  const comments = data === null
    ? []
    : [...fresh, ...data.filter((comment) => !freshIds.has(comment.comment_id))];
  return { comments, loading, notFound: error?.status === 404, error, reload, prepend };
}
