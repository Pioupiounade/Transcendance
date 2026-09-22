/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL de l'API (sans slash final). Voir `.env.example`. */
  readonly VITE_API_URL: string;
  /** Cible du proxy Vite en dev. Lue par `vite.config.ts` uniquement. */
  readonly VITE_DEV_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
