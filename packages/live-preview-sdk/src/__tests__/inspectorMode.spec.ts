// @vitest-environment jsdom
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

import { LIVE_PREVIEW_EDITOR_SOURCE } from '../constants';
import { InspectorMode } from '../inspectorMode';
import { InspectorModeEventMethods, LivePreviewPostMessageMethods } from '../messages';
import { sendMessageToEditor } from '../helpers';

vi.mock('../helpers');

const locale = 'en-US';

const ObserverMock = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  takeRecords: vi.fn(),
  unobserve: vi.fn(),
}));

vi.stubGlobal('ResizeObserver', ObserverMock);
vi.stubGlobal('MutationObserver', ObserverMock);

describe('InspectorMode', () => {
  let inspectorMode: InspectorMode;
  const targetOrigin = ['https://app.contentful.com'];

  beforeEach(() => {
    inspectorMode = new InspectorMode({ locale, targetOrigin });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('receiveMessage', () => {
    test("shouldn't change anything if the incoming message isnt the correct action", () => {
      const spy = vi.spyOn(document.body.classList, 'toggle');
      // @ts-expect-error -- only for test
      inspectorMode.receiveMessage({
        action: LivePreviewPostMessageMethods.ENTRY_UPDATED,
        method: LivePreviewPostMessageMethods.ENTRY_UPDATED,
      });
      expect(spy).not.toHaveBeenCalled();
    });

    test('should send the tagged elements back to the editor', () => {
      inspectorMode.receiveMessage({
        action: InspectorModeEventMethods.INSPECTOR_MODE_CHANGED,
        from: 'live-preview',
        method: InspectorModeEventMethods.INSPECTOR_MODE_CHANGED,
        source: LIVE_PREVIEW_EDITOR_SOURCE,
        isInspectorActive: true,
      });

      expect(sendMessageToEditor).toHaveBeenCalledOnce();
      expect(sendMessageToEditor).toHaveBeenCalledWith(
        InspectorModeEventMethods.TAGGED_ELEMENTS,
        {
          elements: [],
        },
        targetOrigin
      );
    });
  });
});
