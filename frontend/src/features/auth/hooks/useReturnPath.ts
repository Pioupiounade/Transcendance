import { useLocation } from 'react-router';

const HOME = '/';

/**
 * Destination après connexion : la page demandée (`state.from` posé par `RequireAuth` ou un lien de connexion),
 * query comprise (`/map?at=…`, `/actions/new?at=…`), sinon l'accueil.
 */
export const useReturnPath = (): string => {
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
  if (!from?.pathname) return HOME;
  return `${from.pathname}${from.search ?? ''}`;
};
