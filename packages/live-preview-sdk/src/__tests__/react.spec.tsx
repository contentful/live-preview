// @vitest-environment jsdom
import React, { PropsWithChildren } from 'react';

import { act, render, renderHook } from '@testing-library/react';
import { describe, it, vi, afterEach, expect, beforeEach } from 'vitest';

import {
  ContentfulLivePreviewProvider,
  useContentfulLiveUpdates,
  useContentfulInspectorMode,
} from '../react';

import { ContentfulLivePreview } from '..';

import { Argument } from '../types';

const locale = 'en-US';

describe('ContentfulLivePreviewProvider', () => {
  it('should warn about the missing locale property', () => {
    // Keep test log clean of unnecessary console.error noise
    const spy = vi.spyOn(console, 'error');
    spy.mockImplementation(() => {});

    expect(
      // @ts-expect-error -- case locale not provided (e.g. JavaScript usage)
      () => render(<ContentfulLivePreviewProvider>Hello World</ContentfulLivePreviewProvider>)
    ).toThrowError(
      'ContentfulLivePreviewProvider have to be called with a locale property (for example: `<ContentfulLivePreviewProvider locale="en-US">{children}</ContentfulLivePreviewProvider>`'
    );

    spy.mockRestore();
  });
});

describe('useContentfulLiveUpdates', () => {
  const unsubscribe = vi.fn();
  const subscribe = vi.spyOn(ContentfulLivePreview, 'subscribe');

  const createData = (id: string, title = 'Hello') => ({ sys: { id }, title });
  const wrapper = ({ children }: PropsWithChildren) => (
    <ContentfulLivePreviewProvider locale="en-US">{children}</ContentfulLivePreviewProvider>
  );

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
      wrapper,
    });

    expect(result.current).toEqual(initialData);
  });

  it('should bind the subscribe fn', () => {
    const initialData = createData('2');
    const { unmount } = renderHook((data) => useContentfulLiveUpdates(data, locale), {
      initialProps: initialData,
      wrapper,
    });

    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledWith('edit', {
      data: initialData,
      locale,
      callback: expect.any(Function),
    });

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should react to updates on the original data', () => {
    const initialData = createData('3');
    const { result, rerender } = renderHook((data) => useContentfulLiveUpdates(data, locale), {
      initialProps: initialData,
      wrapper,
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
      wrapper,
    });

    expect(result.current).toEqual(initialData);

    const updatedData1 = createData('4', 'Hello World');
    act(() => {
      subscribe.mock.calls[0][1].callback(updatedData1);
      vi.advanceTimersToNextTimer();
    });

    expect(result.current).toEqual(updatedData1);

    const updatedData2 = createData('4', 'Hello World!');
    act(() => {
      subscribe.mock.calls[0][1].callback(updatedData2);
      vi.advanceTimersToNextTimer();
    });

    expect(result.current).toEqual(updatedData2);
  });

  it('should debounce updates', () => {
    let counter = 0;
    const useTestHook = (data: Record<string, unknown>, locale: string) => {
      const value = useContentfulLiveUpdates(data, locale);
      counter++;
      return value;
    };

    const initialData = createData('5');
    const { result } = renderHook((data) => useTestHook(data, locale), {
      initialProps: initialData,
      wrapper,
    });

    expect(result.current).toEqual(initialData);
    expect(counter).toEqual(1);

    const updatedData = createData('5', 'Hello World');
    act(() => {
      subscribe.mock.calls[0][1].callback(createData('5', 'Hello W'));
      subscribe.mock.calls[0][1].callback(createData('5', 'Hello Wo'));
      subscribe.mock.calls[0][1].callback(createData('5', 'Hello Wor'));
      subscribe.mock.calls[0][1].callback(createData('5', 'Hello Worl'));
      subscribe.mock.calls[0][1].callback(updatedData);
      vi.advanceTimersToNextTimer();
    });

    expect(result.current).toEqual(updatedData);
    expect(counter).toEqual(2);
  });

  it('should not listen to changes if the initial data is empty', () => {
    const { rerender } = renderHook((data) => useContentfulLiveUpdates(data, locale), {
      initialProps: undefined as Argument | null | undefined,
      wrapper,
    });

    rerender(null);
    rerender([]);
    rerender({});

    expect(subscribe).not.toHaveBeenCalled();
  });

  it('should not listen if live updates are disabled', () => {
    const initialData = createData('6');
    renderHook((data) => useContentfulLiveUpdates(data, locale), {
      initialProps: initialData,
      wrapper: ({ children }) => (
        <ContentfulLivePreviewProvider locale={locale} enableLiveUpdates={false}>
          {children}
        </ContentfulLivePreviewProvider>
      ),
    });

    expect(subscribe).not.toBeCalled();
  });
});

describe('useContentfulInspectorMode', () => {
  describe('entry', () => {
    it('should provide a helper function to generate the correct tags (no initial data)', () => {
      const { result } = renderHook((data) => useContentfulInspectorMode(data), {
        initialProps: undefined,
        wrapper: ({ children }) => (
          <ContentfulLivePreviewProvider locale={locale}>{children}</ContentfulLivePreviewProvider>
        ),
      });

      expect(result.current({ entryId: '1', locale, fieldId: 'title' })).toEqual({
        'data-contentful-entry-id': '1',
        'data-contentful-field-id': 'title',
        'data-contentful-locale': 'en-US',
      });
    });

    it('should provide a helper function to generate the correct tags (initial entryId)', () => {
      const { result } = renderHook((data) => useContentfulInspectorMode(data), {
        initialProps: { entryId: '1' },
        wrapper: ({ children }) => (
          <ContentfulLivePreviewProvider locale={locale}>{children}</ContentfulLivePreviewProvider>
        ),
      });

      expect(result.current({ locale, fieldId: 'title' })).toEqual({
        'data-contentful-entry-id': '1',
        'data-contentful-field-id': 'title',
        'data-contentful-locale': 'en-US',
      });
    });

    it('should provide a helper function to generate the correct tags (initial locale)', () => {
      const { result } = renderHook((data) => useContentfulInspectorMode(data), {
        initialProps: { locale },
        wrapper: ({ children }) => (
          <ContentfulLivePreviewProvider locale={locale}>{children}</ContentfulLivePreviewProvider>
        ),
      });

      expect(result.current({ entryId: '1', fieldId: 'title' })).toEqual({
        'data-contentful-entry-id': '1',
        'data-contentful-field-id': 'title',
        'data-contentful-locale': 'en-US',
      });
    });

    it('should provide a helper function to generate the correct tags (initial entryId & locale)', () => {
      const { result } = renderHook((data) => useContentfulInspectorMode(data), {
        initialProps: { entryId: '1', locale },
        wrapper: ({ children }) => (
          <ContentfulLivePreviewProvider locale={locale}>{children}</ContentfulLivePreviewProvider>
        ),
      });

      expect(result.current({ fieldId: 'title' })).toEqual({
        'data-contentful-entry-id': '1',
        'data-contentful-field-id': 'title',
        'data-contentful-locale': 'en-US',
      });
    });

    it('should return null because the inspector mode is disabled', () => {
      const { result } = renderHook((data) => useContentfulInspectorMode(data), {
        initialProps: { locale, entryId: '1' },
        wrapper: ({ children }) => (
          <ContentfulLivePreviewProvider locale={locale} enableInspectorMode={false}>
            {children}
          </ContentfulLivePreviewProvider>
        ),
      });

      expect(result.current({ fieldId: 'title' })).toBeNull();
    });
  });
  describe('asset', () => {
    it('should provide a helper function to generate the correct tags (no initial data)', () => {
      const { result } = renderHook((data) => useContentfulInspectorMode(data), {
        initialProps: undefined,
        wrapper: ({ children }) => (
          <ContentfulLivePreviewProvider locale={locale}>{children}</ContentfulLivePreviewProvider>
        ),
      });

      expect(result.current({ assetId: '1', locale, fieldId: 'title' })).toEqual({
        'data-contentful-asset-id': '1',
        'data-contentful-field-id': 'title',
        'data-contentful-locale': 'en-US',
      });
    });

    it('should provide a helper function to generate the correct tags (initial entryId)', () => {
      const { result } = renderHook((data) => useContentfulInspectorMode(data), {
        initialProps: { assetId: '1' },
        wrapper: ({ children }) => (
          <ContentfulLivePreviewProvider locale={locale}>{children}</ContentfulLivePreviewProvider>
        ),
      });

      expect(result.current({ locale, fieldId: 'title' })).toEqual({
        'data-contentful-asset-id': '1',
        'data-contentful-field-id': 'title',
        'data-contentful-locale': 'en-US',
      });
    });

    it('should provide a helper function to generate the correct tags (initial locale)', () => {
      const { result } = renderHook((data) => useContentfulInspectorMode(data), {
        initialProps: { locale },
        wrapper: ({ children }) => (
          <ContentfulLivePreviewProvider locale={locale}>{children}</ContentfulLivePreviewProvider>
        ),
      });

      expect(result.current({ assetId: '1', fieldId: 'title' })).toEqual({
        'data-contentful-asset-id': '1',
        'data-contentful-field-id': 'title',
        'data-contentful-locale': 'en-US',
      });
    });

    it('should provide a helper function to generate the correct tags (initial entryId & locale)', () => {
      const { result } = renderHook((data) => useContentfulInspectorMode(data), {
        initialProps: { assetId: '1', locale },
        wrapper: ({ children }) => (
          <ContentfulLivePreviewProvider locale={locale}>{children}</ContentfulLivePreviewProvider>
        ),
      });

      expect(result.current({ fieldId: 'title' })).toEqual({
        'data-contentful-asset-id': '1',
        'data-contentful-field-id': 'title',
        'data-contentful-locale': 'en-US',
      });
    });

    it('should return null because the inspector mode is disabled', () => {
      const { result } = renderHook((data) => useContentfulInspectorMode(data), {
        initialProps: { locale, assetId: '1' },
        wrapper: ({ children }) => (
          <ContentfulLivePreviewProvider locale={locale} enableInspectorMode={false}>
            {children}
          </ContentfulLivePreviewProvider>
        ),
      });

      expect(result.current({ fieldId: 'title' })).toBeNull();
    });
  });
});
