import { createContext } from 'react';
import type { Credentials } from '../api/authApi';
import type { AuthStatus, AuthUser } from '../types';

export type AuthState = {
  status: AuthStatus;
  /** Renseigné uniquement quand `status === 'authenticated'`. */
  user: AuthUser | null;
  /** Connexion : ouvre la session et passe en `authenticated`. Rejette avec l'`ApiError` du backend. */
  signIn: (credentials: Credentials) => Promise<void>;
  /** Inscription : crée le compte, ouvre la session. Rejette avec l'`ApiError` du backend. */
  signUp: (credentials: Credentials) => Promise<void>;
  /** Déconnexion : révoque côté serveur (au mieux) puis efface la session locale. */
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);
