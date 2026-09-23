import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiUrl = env.VITE_API_URL || '/api';
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:3000';

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      // CORS non activé côté backend : en dev, le navigateur parle à Vite,
      // qui réécrit `${apiUrl}/x` vers `${proxyTarget}/x`.
      proxy: apiUrl.startsWith('/')
        ? {
            [apiUrl]: {
              target: proxyTarget,
              changeOrigin: true,
              rewrite: (path) => path.slice(apiUrl.length),
            },
          }
        : undefined,
    },
  };
});
