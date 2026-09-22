import { createContext } from 'react';
import type { AuthStatus, AuthUser } from '../types';

export type AuthState = {
  status: AuthStatus;
  /** Renseigné uniquement quand `status === 'authenticated'`. */
  user: AuthUser | null;
  /** Déconnexion : révoque côté serveur (au mieux) puis efface la session locale. */
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);
