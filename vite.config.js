import { defineConfig } from 'vite';

export default defineConfig({
  base: '/beewaker-portfolio/',
  build: {
    target: 'es2022',
    // Three.js is lazy-loaded only after an artwork is opened; its dedicated
    // chunk is expected to be larger than Vite's generic application warning.
    chunkSizeWarningLimit: 750,
  },
});
