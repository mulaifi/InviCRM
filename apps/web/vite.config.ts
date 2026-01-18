import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => `/crm${path}`,
        cookieDomainRewrite: 'localhost',
      },
      // Proxy auth endpoints so cookies work correctly
      '/crm/api/auth': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
});
