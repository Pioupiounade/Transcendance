import { http } from '@/shared/api';
import type { AuthUser } from '../types';

export type Credentials = { email: string; password: string };

/** Réponse de `/auth/login` et `/auth/register` (docs/api_contract.md §5). */
export type AuthSuccessResponse = {
  success: true;
  user: AuthUser;
  access_token: string;
  refresh_token: string;
};

export type AuthFailureResponse = {
  success: false;
  reason: 
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_DISABLED'
  | 'EMAIL_TAKEN';
};

export type AuthResponse = AuthSuccessResponse | AuthFailureResponse;

export const login = (credentials: Credentials) => http.post<AuthResponse>('/auth/login', credentials);

export const register = (credentials: Credentials) =>
  http.post<AuthResponse>('/auth/register', credentials);

export const getMe = (signal?: AbortSignal) => http.get<AuthUser>('/auth/me', { signal });

export const logout = () => http.post<{ message: string }>('/auth/logout');

export const heartbeat = (signal?: AbortSignal) =>
  http.patch<{ user_id: string; last_seen_at: string }>(
    '/users/me/heartbeat',
    undefined,
    { signal },
  );