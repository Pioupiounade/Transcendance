import { useCallback, useEffect, useMemo, useState } from 'react';

export type AdminListOptions<T, S extends string> = {
  /** Identifiant (entier renvoyé en chaîne) : ordre de création et remplacement d'une ligne. */
  id: (item: T) => string;
  status: (item: T) => S;
  /** Tous les statuts possibles, dans l'ordre des puces de filtre. */
  statuses: readonly S[];
  /** Texte fouillé par la recherche (e-mail, titre…), comparé sans tenir compte de la casse. */
  text: (item: T) => string;
};

const PAGE_SIZE = 20;

/**
 * État d'une liste de modération, le même pour les trois sections : lignes remplacées par la réponse du backend
 * après un geste (pas de rechargement), recherche, filtre par statut avec compteurs, pagination « Show more ».
 * Les listes de l'API ne sont pas triées : les lignes sont rangées par id, l'ordre de création.
 * Les fonctions d'`options` doivent être stables (constante de module) : elles entrent dans les dépendances.
 */
export function useAdminList<T, S extends string>(items: T[], { id, status, statuses, text }: AdminListOptions<T, S>) {
  const [updated, setUpdated] = useState<Record<string, T>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<S | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const reset = useCallback(() => setUpdated({}), []);

  useEffect(() => {
    window.addEventListener('user:deleted', reset);
    window.addEventListener('user:status-changed', reset);

    return () => {
      window.removeEventListener('user:deleted', reset);
      window.removeEventListener('user:status-changed', reset);
    };
  }, [reset]);

  const all = useMemo(
    () => items.map((item) => updated[id(item)] ?? item).sort((a, b) => Number(id(a)) - Number(id(b))),
    [items, updated, id],
  );
  const counts = useMemo(() => {
    const result = Object.fromEntries(statuses.map((value) => [value, 0])) as Record<S, number>;
    for (const item of all) result[status(item)] += 1;
    return result;
  }, [all, statuses, status]);
  const matching = useMemo(() => {
    const query = search.trim().toLowerCase();
    return all.filter(
      (item) => (filter === null || status(item) === filter) && text(item).toLowerCase().includes(query),
    );
  }, [all, search, filter, status, text]);

  const hidden = Math.max(matching.length - visible, 0);
  return {
    total: all.length,
    counts,
    matching,
    rows: matching.slice(0, visible),
    hidden,
    /** Nombre de lignes que « Show more » ajoutera. */
    nextPage: Math.min(hidden, PAGE_SIZE),
    search,
    filter,
    changeSearch: (value: string) => {
      setSearch(value);
      setVisible(PAGE_SIZE);
    },
    changeFilter: (value: S | null) => {
      setFilter(value);
      setVisible(PAGE_SIZE);
    },
    showMore: () => setVisible((count) => count + PAGE_SIZE),
    /** Remplace une ligne par sa version renvoyée par le backend. */
    replace: (item: T) => setUpdated((current) => ({ ...current, [id(item)]: item })),
    /** Oublie les remplacements, avant un rechargement complet. */
    reset,
  };
}
