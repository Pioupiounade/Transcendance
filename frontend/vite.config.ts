import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiUrl = env.VITE_API_URL || '/api';
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'https://localhost:3000';

  const proxy = {
    ...(apiUrl.startsWith('/')
      ? {
          [apiUrl]: {
            target: proxyTarget,
            changeOrigin: true,
            secure: false,
            rewrite: (path: string) => path.slice(apiUrl.length),
          },
        }
      : {}),
    '/socket.io': {
      target: proxyTarget,
      changeOrigin: true,
      secure: false,
      ws: true,
    },
    '/static': {
      target: proxyTarget,
      changeOrigin: true,
      secure: false,
    },
  };
  
  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      https: {
        key: fs.readFileSync(env.SSL_KEY_PATH ?? 'certs/key.pem'),
        cert: fs.readFileSync(env.SSL_CERT_PATH ?? 'certs/cert.pem'),
      },
      proxy,
    },
  };
});
