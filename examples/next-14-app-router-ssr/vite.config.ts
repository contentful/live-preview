import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      'process.env': env,
    },
    build: {
      lib: {
        entry: resolve(__dirname, 'public/_live-preview.ts'),
        name: 'live-preview',
        fileName: 'live-preview',
      },
      outDir: resolve(__dirname, 'public'),
      emptyOutDir: false,
    },
  };
});
