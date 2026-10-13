import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { session } from '@/shared/api';
import {
  getMe,
  login,
  logout,
  register,
  type AuthSuccessResponse,
  type Credentials,
} from '../api/authApi';
import { AuthContext, type AuthState } from '../hooks/authContext';
import type { AuthStatus, AuthUser } from '../types';

type AuthProviderProps = { children: ReactNode };

type Snapshot = { status: AuthStatus; user: AuthUser | null };

const ANONYMOUS: Snapshot = { status: 'anonymous', user: null };

// Au chargement, l'access token (mémoire) est perdu ; s'il reste une session persistée,
// on passe par `loading` le temps de GET /auth/me (le client HTTP rafraîchit le token si besoin).
// Sans cet état intermédiaire, un utilisateur connecté verrait un flash de redirection vers /login.
export function AuthProvider({ children }: AuthProviderProps) {
  const [snapshot, setSnapshot] = useState<Snapshot>(() =>
    session.exists ? { status: 'loading', user: null } : ANONYMOUS,
  );

  useEffect(() => {
    if (!session.exists) return;
    const controller = new AbortController();
    getMe(controller.signal)
      .then((user) => setSnapshot({ status: 'authenticated', user }))
      .catch(() => {
        if (controller.signal.aborted) return;
        session.clear();
        setSnapshot(ANONYMOUS);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => session.onExpire(() => setSnapshot(ANONYMOUS)), []);

  // Login et register renvoient la même chose : tokens + utilisateur.
 const open = useCallback((response: AuthSuccessResponse) => {
  const { success: _success, user, ...tokens } = response;
    session.set(tokens, user.user_id);
    setSnapshot({ status: 'authenticated', user });
  }, []);

  const signIn = useCallback(
    async (credentials: Credentials) => {
      const response = await login(credentials);

      if (!response.success) {
        throw response;
      }

      open(response);
    },
    [open],
  );

  const signUp = useCallback(
    async (credentials: Credentials) => {
      const response = await register(credentials);

      if (!response.success) {
        throw response;
      }

      open(response);
    },
    [open],
  );
  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch {
      // token déjà expiré ou réseau absent : la session locale est effacée quoi qu'il arrive
    }
    session.clear();
    setSnapshot(ANONYMOUS);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ ...snapshot, signIn, signUp, signOut }),
    [snapshot, signIn, signUp, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
