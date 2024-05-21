// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { LIVE_PREVIEW_EDITOR_SOURCE } from '../constants.js';
import { sendMessageToEditor } from '../helpers/index.js';
import { InspectorMode } from '../inspectorMode/index.js';
import { InspectorModeEventMethods, LivePreviewPostMessageMethods } from '../messages.js';

vi.mock('../helpers');

const locale = 'en-US';

const createObserverMock = () =>
  vi.fn(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    takeRecords: vi.fn(),
    unobserve: vi.fn(),
  }));

const IntersectionObserver = createObserverMock();
vi.stubGlobal('ResizeObserver', createObserverMock());
vi.stubGlobal('MutationObserver', createObserverMock());
vi.stubGlobal('IntersectionObserver', IntersectionObserver);

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
        data: {},
        action: InspectorModeEventMethods.INSPECTOR_MODE_CHANGED,
        method: InspectorModeEventMethods.INSPECTOR_MODE_CHANGED,
        source: LIVE_PREVIEW_EDITOR_SOURCE,
        isInspectorActive: true,
      });

      // We need to trigger the intersection observer manually
      // @ts-expect-error no typings available :(
      IntersectionObserver.mock.calls[0][0]([]);

      expect(sendMessageToEditor).toHaveBeenCalledOnce();
      expect(sendMessageToEditor).toHaveBeenCalledWith(
        InspectorModeEventMethods.TAGGED_ELEMENTS,
        {
          elements: [],
          automaticallyTaggedCount: 0,
          manuallyTaggedCount: 0,
        },
        targetOrigin,
      );
    });
  });
});
