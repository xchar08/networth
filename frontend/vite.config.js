// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Ensure this is set to 'dist'
    // base: '/', // Optional: Ensure the base path is correct
  },
});
