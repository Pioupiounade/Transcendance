// Variables d'environnement validées au démarrage. Déclarées dans `src/vite-env.d.ts`,
// documentées dans `.env.example`.

const readRequired = (name: keyof ImportMetaEnv): string => {
  const value = import.meta.env[name];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Variable d'environnement ${name} manquante : copier .env.example vers .env`);
  }
  return value.trim();
};

export const env = {
  /** Base URL de l'API, sans slash final. */
  apiUrl: readRequired('VITE_API_URL').replace(/\/+$/, ''),
} as const;
