import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    // Output directory set to '../dist' to place it at the root level
    outDir: path.resolve(__dirname, '../dist'),
    emptyOutDir: true, // Clears the output directory before each build
    // Optional: Customize other build options as needed
    // minify: 'esbuild',
    // sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Add other aliases if necessary
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Ensure this matches your backend server
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
