import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Crucial: Makes paths relative so they work in the extension context
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        background: 'service-worker.js' // Ensure service worker is bundled
      },
      output: {
        entryFileNames: '[name].js'
      }
    }
  }
});