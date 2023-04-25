// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, it, vi, afterEach, expect, beforeEach } from 'vitest';

import { useContentfulLiveUpdates } from '../react';

import { ContentfulLivePreview } from '..';

import { Argument } from '../types';

describe('useContentfulLiveUpdates', () => {
  const unsubscribe = vi.fn();
  const subscribe = vi.spyOn(ContentfulLivePreview, 'subscribe');

  const locale = 'en-US';
  const createData = (id: string, title = 'Hello') => ({ sys: { id }, title });

  beforeEach(() => {
    subscribe.mockReturnValue(unsubscribe);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should return the original data', () => {
    const initialData = createData('1');
    const { result } = renderHook((data) => useContentfulLiveUpdates(data, locale), {
      initialProps: initialData,
    });

    expect(result.current).toEqual(initialData);
  });

  it('should bind the subscibe fn', () => {
    const initialData = createData('2');
    const { unmount } = renderHook((data) => useContentfulLiveUpdates(data, locale), {
      initialProps: initialData,
    });

    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledWith(initialData, locale, expect.any(Function));

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should react to updates on the original data', () => {
    const initialData = createData('3');
    const { result, rerender } = renderHook((data) => useContentfulLiveUpdates(data, locale), {
      initialProps: initialData,
    });

    expect(result.current).toEqual(initialData);

    const updatedData1 = createData('3', 'Hello World');
    act(() => {
      rerender(updatedData1);
    });
    expect(result.current).toEqual(updatedData1);

    const updatedData2 = createData('3', 'Hello World!');
    act(() => {
      rerender(updatedData2);
    });
    expect(result.current).toEqual(updatedData2);
  });

  it('should listen to live updates and returns them instead', () => {
    const initialData = createData('4');
    const { result } = renderHook((data) => useContentfulLiveUpdates(data, locale), {
      initialProps: initialData,
    });

    expect(result.current).toEqual(initialData);

    const updatedData1 = createData('4', 'Hello World');
    act(() => {
      subscribe.mock.calls[0][2](updatedData1);
      vi.advanceTimersToNextTimer();
    });

    expect(result.current).toEqual(updatedData1);

    const updatedData2 = createData('4', 'Hello World!');
    act(() => {
      subscribe.mock.calls[0][2](updatedData2);
      vi.advanceTimersToNextTimer();
    });

    expect(result.current).toEqual(updatedData2);
  });

  it('should debounce updates', () => {
    let counter = 0;
    const useTestHook = (data: any, locale: string) => {
      const value = useContentfulLiveUpdates(data, locale);
      counter++;
      return value;
    };

    const initialData = createData('5');
    const { result } = renderHook((data) => useTestHook(data, locale), {
      initialProps: initialData,
    });

    expect(result.current).toEqual(initialData);
    expect(counter).toEqual(1);

    const updatedData = createData('5', 'Hello World');
    act(() => {
      subscribe.mock.calls[0][2](createData('5', 'Hello W'));
      subscribe.mock.calls[0][2](createData('5', 'Hello Wo'));
      subscribe.mock.calls[0][2](createData('5', 'Hello Wor'));
      subscribe.mock.calls[0][2](createData('5', 'Hello Worl'));
      subscribe.mock.calls[0][2](updatedData);
      vi.advanceTimersToNextTimer();
    });

    expect(result.current).toEqual(updatedData);
    expect(counter).toEqual(2);
  });

  it('shouldnt listen to changes if the initial data is empty', () => {
    const { rerender } = renderHook((data) => useContentfulLiveUpdates(data, locale), {
      initialProps: undefined as Argument | null | undefined,
    });

    rerender(null);
    rerender([]);
    rerender({});

    expect(subscribe).not.toHaveBeenCalled();
  });

  it('shouldnt call subscribe if the isDisabled flag is true', () => {
    const { rerender } = renderHook((data) => useContentfulLiveUpdates(data, locale, false, true), {
      initialProps: undefined as Argument | null | undefined,
    });

    rerender(null);
    rerender([]);
    rerender({});

    expect(subscribe).not.toHaveBeenCalled();
  });
});
