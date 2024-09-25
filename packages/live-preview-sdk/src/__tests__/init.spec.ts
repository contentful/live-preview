/* eslint-disable @typescript-eslint/no-explicit-any */
// @vitest-environment jsdom
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { isInsideIframe } from '../helpers/index.js';
import { ContentfulLivePreview } from '../index.js';
import { InspectorMode } from '../inspectorMode/index.js';
import { LiveUpdates } from '../liveUpdates.js';

vi.mock('../helpers');

const ObserverMock = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  takeRecords: vi.fn(),
  unobserve: vi.fn(),
}));

const livePreviewConfig = {
  locale: 'en-US',
  targetOrigin: '*',
};

vi.stubGlobal('ResizeObserver', ObserverMock);
vi.stubGlobal('MutationObserver', ObserverMock);
vi.stubGlobal('IntersectionObserver', ObserverMock);

describe('init', () => {
  beforeEach(() => {
    (isInsideIframe as Mock).mockReturnValue(true);

    // Reset to default variables
    ContentfulLivePreview.initialized = false;
    ContentfulLivePreview.inspectorMode = null;
    ContentfulLivePreview.inspectorModeEnabled = true;
    ContentfulLivePreview.liveUpdates = null;
    ContentfulLivePreview.liveUpdatesEnabled = true;
    ContentfulLivePreview.locale = '';
  });

  it('returns a Promise that resolves to a LivePreview instance when running in a browser environment', async () => {
    const livePreviewInstance = await ContentfulLivePreview.init(livePreviewConfig);
    expect(livePreviewInstance).toBeInstanceOf(InspectorMode);
  });

  it('returns undefined when not running in a browser environment', () => {
    const windowBackup = global.window;
    (global as any).window = undefined;
    const result = ContentfulLivePreview.init(livePreviewConfig);
    expect(result).toBeUndefined();
    global.window = windowBackup;
  });

  it('returns a Promise that resolves to the same LivePreview instance when called multiple times', async () => {
    const livePreviewInstance1 = await ContentfulLivePreview.init(livePreviewConfig);
    const livePreviewInstance2 = await ContentfulLivePreview.init(livePreviewConfig);
    expect(livePreviewInstance1).toBe(livePreviewInstance2);
  });

  it('returns null when not inside an iframe', async () => {
    (isInsideIframe as Mock).mockReturnValue(false);

    const result = await ContentfulLivePreview.init(livePreviewConfig);

    expect(result).toBeNull();
    expect(ContentfulLivePreview.liveUpdatesEnabled).toBeFalsy();
    expect(ContentfulLivePreview.liveUpdates).toBeNull();
  });

  it('warns about invalid init call (missing locale)', () => {
    expect(ContentfulLivePreview.init).toThrow(
      "Init function has to be called with a locale configuration (for example: `ContentfulLivePreview.init({ locale: 'en-US'})`)",
    );
  });

  describe('flags', () => {
    it('should use enableInspectorMode with false to disable the inspectorMode', async () => {
      await ContentfulLivePreview.init({ ...livePreviewConfig, enableInspectorMode: false });

      expect(ContentfulLivePreview.inspectorModeEnabled).toBeFalsy();
      expect(ContentfulLivePreview.inspectorMode).toBeNull();

      expect(ContentfulLivePreview.liveUpdatesEnabled).toBeTruthy();
      expect(ContentfulLivePreview.liveUpdates).toBeInstanceOf(LiveUpdates);
    });

    it('should use enableLiveUpdates with false to disable the live updates', async () => {
      await ContentfulLivePreview.init({ ...livePreviewConfig, enableLiveUpdates: false });

      expect(ContentfulLivePreview.inspectorModeEnabled).toBeTruthy();
      expect(ContentfulLivePreview.inspectorMode).toBeInstanceOf(InspectorMode);

      expect(ContentfulLivePreview.liveUpdatesEnabled).toBeFalsy();
      expect(ContentfulLivePreview.liveUpdates).toBeNull();
    });
  });
});
