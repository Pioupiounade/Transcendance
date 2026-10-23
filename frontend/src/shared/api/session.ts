// Session courante : access token en mémoire (15 min), refresh token + id utilisateur
// persistés (7 jours), car le backend attend le refresh token dans le body de POST /auth/refresh.
// À revoir si le backend passe aux cookies httpOnly.

export type SessionTokens = {
  access_token: string;
  refresh_token: string;
};

type Persisted = { refreshToken: string; userId: string };

const STORAGE_KEY = 'pioupiounades.session';

let accessToken: string | null = null;
let persisted: Persisted | null = readPersisted();
const expireListeners = new Set<() => void>();
const tokenListeners = new Set<() => void>();

function readPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' && parsed !== null &&
      typeof (parsed as Persisted).refreshToken === 'string' &&
      typeof (parsed as Persisted).userId === 'string'
    ) {
      return parsed as Persisted;
    }
  } catch {
    // stockage indisponible ou corrompu : on repart sans session
  }
  return null;
}

function writePersisted(value: Persisted | null): void {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // stockage indisponible : la session ne survivra pas au rechargement
  }
}

export const session = {
  /** Id de l'utilisateur connecté (string, comme tous les ids de l'API), ou null. */
  get userId(): string | null {
    return persisted?.userId ?? null;
  },
  get accessToken(): string | null {
    return accessToken;
  },
  get refreshToken(): string | null {
    return persisted?.refreshToken ?? null;
  },
  /** Une session persistée existe (le refresh peut encore échouer). */
  get exists(): boolean {
    return persisted !== null;
  },

  /** Après login/register : tokens + id de l'utilisateur. Après refresh : `userId` omis, conservé. */
  set(tokens: SessionTokens, userId: string | null = persisted?.userId ?? null): void {
    if (userId === null) throw new Error('session.set : userId requis pour une nouvelle session');
    accessToken = tokens.access_token;
    persisted = { refreshToken: tokens.refresh_token, userId };
    writePersisted(persisted);

    tokenListeners.forEach((listener) => listener());
  },

  onTokensChanged(listener: () => void): () => void {
    tokenListeners.add(listener);
    return () => tokenListeners.delete(listener);
  },

  clear(): void {
    accessToken = null;
    persisted = null;
    writePersisted(null);
  },

  /** Appelé quand le refresh échoue (session expirée côté serveur). Renvoie la désinscription. */
  onExpire(listener: () => void): () => void {
    expireListeners.add(listener);
    return () => expireListeners.delete(listener);
  },

  /** Interne au client HTTP. */
  expire(): void {
    session.clear();
    expireListeners.forEach((listener) => listener());
  },
};
