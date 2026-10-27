import { useCallback, useState } from 'react';
import { useResource } from '@/shared/hooks/useResource';
import type { OrganizationComment } from '../types';
import { fetchOrganizationComments } from './organizationsApi';

/** Retouches locales depuis le dernier chargement : évitent de recharger (et de vider) la liste après chaque action. */
type Local = { organizationId: string; added: OrganizationComment[]; removed: readonly string[] };

/**
 * Commentaires d'une organisation, du plus récent au plus ancien. `prepend` insère ce que l'on vient de poster,
 * `remove` retire ce que l'on vient de supprimer, `reload` repart de l'API. Remplaçable par TanStack Query.
 */
export function useOrganizationComments(organizationId: string) {
  const load = useCallback((signal: AbortSignal) => fetchOrganizationComments(organizationId, signal), [organizationId]);
  const { data, loading, error, reload: reloadResource } = useResource(load);
  const [local, setLocal] = useState<Local>({ organizationId, added: [], removed: [] });

  const edit = useCallback(
    (change: (current: Local) => Local) =>
      setLocal((previous) =>
        change(previous.organizationId === organizationId ? previous : { organizationId, added: [], removed: [] }),
      ),
    [organizationId],
  );
  const prepend = useCallback(
    (comment: OrganizationComment) => edit((current) => ({ ...current, added: [comment, ...current.added] })),
    [edit],
  );
  const remove = useCallback(
    (commentId: string) => edit((current) => ({ ...current, removed: [...current.removed, commentId] })),
    [edit],
  );
  const reload = useCallback(() => {
    setLocal({ organizationId, added: [], removed: [] });
    reloadResource();
  }, [organizationId, reloadResource]);

  const current = local.organizationId === organizationId ? local : null;
  const added = current?.added ?? [];
  const addedIds = new Set(added.map((comment) => comment.comment_id));

  const all = data === null
    ? []
    : [...added, ...data.filter((comment) => !addedIds.has(comment.comment_id))];
  const comments =
    current && current.removed.length > 0 ? all.filter((comment) => !current.removed.includes(comment.comment_id)) : all;
  return { comments, loading, error, reload, prepend, remove };
}
