import { http } from '@/shared/api';
import type { AuthUser } from '../types';

export const getMe = (signal?: AbortSignal) => http.get<AuthUser>('/auth/me', { signal });

export const logout = () => http.post<{ message: string }>('/auth/logout');
