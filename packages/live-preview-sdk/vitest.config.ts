import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: [
      ...configDefaults.exclude,
      'src/rest/__tests__/constants.ts',
      'src/rest/__tests__/utils.ts',
      'src/rest/__tests__/fixtures/data.ts',
    ],
  },
});
