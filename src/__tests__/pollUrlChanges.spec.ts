// @vitest-environment jsdom
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';

import { pollUrlChanges } from '../helpers';

describe('pollUrlChanges', () => {
  let previousUrl: string;

  beforeEach(() => {
    vi.useFakeTimers();
    previousUrl = window.location.href;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should call the callback function when the URL changes', () => {
    const callback = vi.fn();
    pollUrlChanges(previousUrl, callback, 500);

    window.history.pushState({}, '', '/new-url');

    vi.advanceTimersByTime(500);

    expect(callback).toHaveBeenCalledWith(`${window.location.origin}/new-url`);
  });

  it('should not call the callback function when the URL does not change', () => {
    const callback = vi.fn();
    pollUrlChanges(previousUrl, callback, 500);

    vi.advanceTimersByTime(500);

    expect(callback).not.toHaveBeenCalled();
  });
});
