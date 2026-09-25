import { env } from '@/shared/config/env';
import { ApiError } from './ApiError';
import { session, type SessionTokens } from './session';

// Client HTTP unique (frontend/CLAUDE.md, « Appels API »). Caché ici, et nulle part ailleurs :
// base URL, JSON, Bearer, 401 → refresh → rejeu, normalisation des erreurs.

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type Query = Record<string, string | number | boolean | null | undefined>;
type Body = Record<string, unknown> | unknown[];

export type RequestOptions = {
  /** Paramètres de query string ; les valeurs null/undefined sont omises. */
  query?: Query;
  signal?: AbortSignal;
};

const AUTH_PREFIX = '/auth';

const buildUrl = (path: string, query: Query | undefined): string => {
  const url = new URL(env.apiUrl + path, window.location.origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
};

const parseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (text === '') return undefined;
  const type = response.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) return text;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const toApiError = (status: number, payload: unknown): ApiError => {
  const message = typeof payload === 'object' && payload !== null ? (payload as { message?: unknown }).message : payload;
  const messages = Array.isArray(message)
    ? message.filter((m): m is string => typeof m === 'string')
    : typeof message === 'string' && message !== ''
      ? [message]
      : [];
  return new ApiError(status, messages);
};

const send = async (method: Method, path: string, body: Body | undefined, options: RequestOptions): Promise<Response> => {
  const headers = new Headers({ Accept: 'application/json' });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (session.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`);
  try {
    return await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, []);
  }
};

// Un seul refresh à la fois : les 401 concurrents attendent la même promesse.
let refreshing: Promise<boolean> | null = null;

const refreshSession = (): Promise<boolean> => {
  refreshing ??= (async () => {
    const refreshToken = session.refreshToken;
    if (refreshToken === null) return false;
    try {
      const response = await send('POST', `${AUTH_PREFIX}/refresh`, { refresh_token: refreshToken }, {});
      if (!response.ok) return false;
      const tokens = (await parseBody(response)) as SessionTokens;
      session.set(tokens);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.isNetwork) throw error;
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
};

const request = async <T>(method: Method, path: string, body: Body | undefined, options: RequestOptions): Promise<T> => {
  let response = await send(method, path, body, options);

  const canRefresh = !path.startsWith(AUTH_PREFIX) || path === `${AUTH_PREFIX}/me`;
  if (response.status === 401 && canRefresh && session.exists) {
    if (await refreshSession()) {
      response = await send(method, path, body, options);
    } else {
      session.expire();
    }
  }

  const payload = await parseBody(response);
  if (!response.ok) throw toApiError(response.status, payload);
  return payload as T;
};

export const http = {
  get: <T>(path: string, options: RequestOptions = {}) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: Body, options: RequestOptions = {}) => request<T>('POST', path, body, options),
  patch: <T>(path: string, body?: Body, options: RequestOptions = {}) => request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options: RequestOptions = {}) => request<T>('DELETE', path, undefined, options),
  /** GET d'une liste : le backend renvoie 404 quand un filtre ne trouve rien, traduit ici en `[]`. */
  list: async <T>(path: string, options: RequestOptions = {}): Promise<T[]> => {
    try {
      return await request<T[]>('GET', path, undefined, options);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return [];
      throw error;
    }
  },
};
