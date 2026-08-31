import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import api from './api.js';

export default defineConfig({
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
