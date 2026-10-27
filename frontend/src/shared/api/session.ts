// Session courante : access token en mémoire (15 min), refresh token + id utilisateur
// persistés (7 jours), car le backend attend le refresh token dans le body de POST /auth/refresh.
// À revoir si le backend passe aux cookies httpOnly.
//
// Plusieurs onglets partagent ce storage, et le backend fait tourner le refresh token à chaque
// POST /auth/refresh : un onglet qui garderait l'ancien token serait déconnecté à son prochain refresh.
// D'où l'écoute de l'événement `storage` (token qui a tourné, ou session fermée, dans un autre onglet).

export type SessionTokens = {
  access_token: string;
  refresh_token: string;
};

type Persisted = { refreshToken: string; userId: string };

const STORAGE_KEY = 'pioupiounades.session';
/** Marge avant l'expiration de l'access token à partir de laquelle on le renouvelle sans attendre un 401. */
const RENEWAL_MARGIN_MS = 30_000;

let accessToken: string | null = null;
/** Instant (horloge locale) à partir duquel l'access token est à renouveler ; null si le JWT ne dit pas sa durée. */
let renewAt: number | null = null;
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

/** Durée de vie annoncée par le JWT (`exp - iat`, deux dates serveur : insensible au décalage d'horloge), ou null. */
function tokenLifetimeMs(token: string): number | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    const { exp, iat } = payload as { exp?: unknown; iat?: unknown };
    if (typeof exp !== 'number' || typeof iat !== 'number' || exp <= iat) return null;
    return (exp - iat) * 1000;
  } catch {
    return null;
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
  /** Access token absent (rechargement) ou proche de l'expiration : à renouveler avant d'appeler l'API. */
  get accessTokenStale(): boolean {
    return accessToken === null || (renewAt !== null && Date.now() >= renewAt);
  },

  /** Après login/register : tokens + id de l'utilisateur. Après refresh : `userId` omis, conservé. */
  set(tokens: SessionTokens, userId: string | null = persisted?.userId ?? null): void {
    if (userId === null) throw new Error('session.set : userId requis pour une nouvelle session');
    accessToken = tokens.access_token;
    const lifetime = tokenLifetimeMs(tokens.access_token);
    // Jamais avant la moitié de la durée de vie : un token très court ne doit pas déclencher un refresh par appel.
    renewAt = lifetime === null ? null : Date.now() + Math.max(lifetime - RENEWAL_MARGIN_MS, lifetime / 2);
    persisted = { refreshToken: tokens.refresh_token, userId };
    writePersisted(persisted);

    tokenListeners.forEach((listener) => listener());
  },

  onTokensChanged(listener: () => void): () => void {
    tokenListeners.add(listener);
    return () => tokenListeners.delete(listener);
  },

  /** Avant un refresh : reprend le refresh token qu'un autre onglet (même utilisateur) a pu faire tourner entre-temps. */
  syncFromStorage(): void {
    const stored = readPersisted();
    if (stored !== null && persisted !== null && stored.userId === persisted.userId) persisted = stored;
  },

  clear(): void {
    accessToken = null;
    renewAt = null;
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

// Un autre onglet a écrit (token qui a tourné : on le reprend) ou effacé (déconnexion : on suit) la session.
// `key === null` : `localStorage.clear()`. L'événement ne vient jamais de l'onglet courant.
window.addEventListener('storage', (event) => {
  if (event.storageArea !== localStorage || (event.key !== STORAGE_KEY && event.key !== null)) return;
  if (persisted === null) return;
  const stored = readPersisted();
  if (stored === null) session.expire();
  else if (stored.userId === persisted.userId) persisted = stored;
});
