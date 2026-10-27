import { env } from '@/shared/config/env';
import { ApiError } from './ApiError';
import { session, type SessionTokens } from './session';

// Client HTTP unique (frontend/CLAUDE.md, « Appels API »). Caché ici, et nulle part ailleurs :
// base URL, JSON, Bearer, 401 → refresh → rejeu, normalisation des erreurs.

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type Query = Record<string, string | number | boolean | null | undefined>;
type Body = Record<string, unknown> | unknown[] | FormData;

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
  if (body !== undefined && !(body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (session.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`);
  try {
    return await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, []);
  }
};

// Le backend fait tourner le refresh token à chaque refresh : deux refreshs simultanés, et le second est
// refusé (déconnexion). Dans l'onglet, un seul refresh à la fois : les 401 concurrents attendent la même
// promesse. Entre onglets, un verrou Web Locks (absent hors contexte sécurisé : on garde la file locale).
const REFRESH_LOCK = 'pioupiounades.refresh';
let refreshing: Promise<boolean> | null = null;

const withRefreshLock = (task: () => Promise<boolean>): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !navigator.locks) return task();
  // `task` ne rejette jamais : un rejet vient du gestionnaire de verrous lui-même (iframe sandbox, origine opaque).
  return navigator.locks.request(REFRESH_LOCK, task).catch(() => task());
};

const refreshSession = (): Promise<boolean> => {
  refreshing ??= withRefreshLock(async () => {
    // Le verrou obtenu, un autre onglet a pu rafraîchir pendant l'attente : on repart de son token.
    session.syncFromStorage();
    const refreshToken = session.refreshToken;
    if (refreshToken === null) return false;
    try {
      const response = await send('POST', `${AUTH_PREFIX}/refresh`, { refresh_token: refreshToken }, {});
      if (!response.ok) return false;
      const tokens = (await parseBody(response)) as SessionTokens;
      session.set(tokens);
      return true;
    } catch {
      return false;
    }
  }).finally(() => {
    refreshing = null;
  });
  return refreshing;
};

// Routes dont un 401 ne signifie pas « token expiré » : jamais de refresh derrière.
const NO_REFRESH = new Set([`${AUTH_PREFIX}/login`, `${AUTH_PREFIX}/register`, `${AUTH_PREFIX}/refresh`]);

const request = async <T>(method: Method, path: string, body: Body | undefined, options: RequestOptions): Promise<T> => {
  const refreshable = session.exists && !NO_REFRESH.has(path);

  // Access token perdu (rechargement de la page) ou sur le point d'expirer : on le renouvelle avant d'appeler,
  // plutôt que d'encaisser un 401 que le navigateur afficherait en erreur console.
  if (refreshable && session.accessTokenStale && !(await refreshSession())) {
    session.expire();
    throw new ApiError(401, []);
  }

  let response = await send(method, path, body, options);

  if (response.status === 401 && refreshable) {
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
