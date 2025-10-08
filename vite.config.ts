import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
const allowedHostsEnv = process.env.ALLOWED_HOSTS || process.env.VITE_ALLOWED_HOSTS || '';
const allowedHosts = allowedHostsEnv
  ? allowedHostsEnv.split(',').map((h) => h.trim()).filter(Boolean)
  : [];

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  preview: {
    // Allow Railway preview host(s) to connect. Set ALLOWED_HOSTS in Railway → Variables.
    allowedHosts,
    host: '0.0.0.0',
  },
});
