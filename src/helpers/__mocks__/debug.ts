import { vi } from 'vitest';

export const debug = {
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
};
