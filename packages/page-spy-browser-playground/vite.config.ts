import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@huolala-tech/page-spy-browser': fileURLToPath(
        new URL('../page-spy-browser/dist/esm/index.min.js', import.meta.url),
      ),
    },
  },
  server: {
    port: 5173,
    allowedHosts: ['5173.huolala.work'],
    fs: {
      allow: [fileURLToPath(new URL('..', import.meta.url))],
    },
  },
});
