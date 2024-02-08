// import { resolve } from 'path';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude],
  },
  // build: {
  //   sourcemap: true,
  //   outDir: './dist',
  //   lib: {
  //     entry: {
  //       index: resolve(__dirname, 'src/index.ts'),
  //       react: resolve(__dirname, 'src/react.tsx'),
  //     },
  //     formats: ['cjs', 'es'],
  //   },
  //   rollupOptions: {
  //     external: ['react'],
  //     output: {
  //       globals: {
  //         react: 'React',
  //       },
  //     },
  //   },
  // },
});
