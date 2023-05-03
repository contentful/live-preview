// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';

import { FieldTagging } from '../fieldTagging';
import { ContentfulLivePreview } from '../index';

describe('init', () => {
  it('returns a Promise that resolves to a LivePreview instance when running in a browser environment', async () => {
    const livePreviewInstance = await ContentfulLivePreview.init();
    expect(livePreviewInstance).toBeInstanceOf(FieldTagging);
  });

  it('returns undefined when not running in a browser environment', () => {
    const windowBackup = global.window;
    (global as any).window = undefined;
    const result = ContentfulLivePreview.init();
    expect(result).toBeUndefined();
    global.window = windowBackup;
  });

  it('returns a Promise that resolves to the same LivePreview instance when called multiple times', async () => {
    const livePreviewInstance1 = await ContentfulLivePreview.init();
    const livePreviewInstance2 = await ContentfulLivePreview.init();
    expect(livePreviewInstance1).toBe(livePreviewInstance2);
  });

  it('returns null when field tagging is disabled', async () => {
    const result = await ContentfulLivePreview.init({ enableInspectorMode: false });
    expect(result).toBeNull();
  });
});
