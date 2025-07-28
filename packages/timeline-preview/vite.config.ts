import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude],
  },
  build: {
    target: 'es2017',
    sourcemap: true,
    outDir: './dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'index',
      formats: ['cjs', 'es'],
    },
  },
  plugins: [
    dts({
      exclude: ['**/__tests__/**'],
    }),
  ],
});
