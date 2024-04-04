import { describe, expect, test } from 'vitest';

import { generateUID } from '../helpers/index.js';

describe('generateUID', () => {
  test('generates unique IDs', () => {
    const results = new Set();
    for (let i = 0; i < 1000; i++) {
      results.add(generateUID());
    }

    expect(results.size).toEqual(1000);
  });
});
