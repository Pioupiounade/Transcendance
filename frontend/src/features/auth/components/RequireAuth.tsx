import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { AUTH_LABELS } from '../labels';
import { AUTH_ROUTES } from '../routes';

/**
 * Route garde : à placer comme route parente (sans `path`) des routes protégées.
 * Anonyme → redirection vers /login avec `state.from` pour revenir après connexion.
 */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <p role="status">{AUTH_LABELS.loading}</p>;
  }
  if (status === 'anonymous') {
    return <Navigate to={AUTH_ROUTES.login} replace state={{ from: location }} />;
  }
  return <Outlet />;
}
