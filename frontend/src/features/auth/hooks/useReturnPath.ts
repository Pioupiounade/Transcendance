import { useLocation } from 'react-router';

const HOME = '/';

/** Destination après connexion : la page protégée demandée (`state.from` posé par `RequireAuth`), sinon l'accueil. */
export const useReturnPath = (): string => {
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  return from && from !== '' ? from : HOME;
};
