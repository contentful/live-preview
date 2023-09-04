import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'public/_live-preview.ts'),
      name: 'live-preview',
      fileName: 'live-preview',
    },
    outDir: resolve(__dirname, 'public/'),
    emptyOutDir: false,
  },
});
