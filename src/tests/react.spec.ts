// @vitest-environment jsdom
import { describe, it, vi, afterEach, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useContentfulLiveUpdates } from '../react';
import { ContentfulLivePreview } from '..';

describe('useContentfulLiveUpdates', () => {
  const unsubscribe = vi.fn();
  const subscribe = vi.spyOn(ContentfulLivePreview, 'subscribe');

  const locale = 'en-US';
  const initialData = { sys: { id: '1' }, title: 'Hello' };
  const updatedData = { sys: { id: '1' }, title: 'Hello World' };

  beforeEach(() => {
    subscribe.mockReturnValue(unsubscribe);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return the original data', () => {
    const { result } = renderHook((data) => useContentfulLiveUpdates(data, locale), {
      initialProps: initialData,
    });

    expect(result.current).toEqual(initialData);
  });

  it('should bind the subscibe fn', () => {
    const { unmount } = renderHook((data) => useContentfulLiveUpdates(data, locale), {
      initialProps: initialData,
    });

    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledWith(initialData, locale, expect.any(Function));

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should react to updates on the original data', () => {
    const { result, rerender } = renderHook((data) => useContentfulLiveUpdates(data, locale), {
      initialProps: initialData,
    });

    expect(result.current).toEqual(initialData);

    act(() => {
      rerender(updatedData);
    });

    expect(result.current).toEqual(updatedData);
  });

  it('should listen to live updates and returns them instead', () => {
    const { result } = renderHook((data) => useContentfulLiveUpdates(data, locale), {
      initialProps: initialData,
    });

    expect(result.current).toEqual(initialData);

    act(() => {
      subscribe.mock.calls[0][2](updatedData);
    });

    expect(result.current).toEqual(updatedData);
  });
});
