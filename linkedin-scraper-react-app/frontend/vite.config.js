import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../dist'), // Outputs to root 'dist/'
    emptyOutDir: true, // Clears the output directory before each build
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Simplifies import paths
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
});
