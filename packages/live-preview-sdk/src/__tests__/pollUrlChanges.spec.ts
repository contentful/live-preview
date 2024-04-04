// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { pollUrlChanges } from '../helpers/index.js';

describe('pollUrlChanges', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should call the callback function when the URL changes', () => {
    const callback = vi.fn();
    pollUrlChanges(callback, 500);

    window.history.pushState({}, '', '/new-url');

    vi.advanceTimersByTime(500);

    expect(callback).toHaveBeenCalledWith(`${window.location.origin}/new-url`);
  });

  it('should not call the callback function when the URL does not change', () => {
    const callback = vi.fn();
    pollUrlChanges(callback, 500);

    vi.advanceTimersByTime(500);

    expect(callback).not.toHaveBeenCalled();
  });
});
