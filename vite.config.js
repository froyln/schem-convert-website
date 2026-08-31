import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import api from './api.js';

export default defineConfig({
  // Self-hosted builds (npm run build && npm start) serve dist/ at '/', so
  // base stays '/' unless a CI build (e.g. GitHub Pages) overrides it.
  base: process.env.VITE_BASE || '/',
  plugins: [
    react(),
    {
      name: 'api-middleware',
      configureServer(server) {
        server.middlewares.use(api);
      },
    },
  ],
});
