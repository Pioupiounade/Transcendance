import { useContext } from 'react';
import { AuthContext, type AuthState } from './authContext';

export const useAuth = (): AuthState => {
  const state = useContext(AuthContext);
  if (state === null) throw new Error('useAuth doit être appelé sous <AuthProvider>');
  return state;
};
