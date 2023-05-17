// @vitest-environment jsdom
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

import { InspectorMode } from '../inspectorMode';

const locale = 'en-US';

describe('InspectorMode', () => {
  let inspectorMode: InspectorMode;

  beforeEach(() => {
    inspectorMode = new InspectorMode({ locale });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('receiveMessage', () => {
    test("shouldn't change anything if the incoming message doesnt contain 'isInspectorActive'", () => {
      const spy = vi.spyOn(document.body.classList, 'toggle');
      inspectorMode.receiveMessage({ entitiy: {} });
      expect(spy).not.toHaveBeenCalled();
    });

    test('should toggle "contentful-inspector--active" class on document.body based on value of isInspectorActive', () => {
      const spy = vi.spyOn(document.body.classList, 'toggle');
      inspectorMode.receiveMessage({ from: 'live-preview', isInspectorActive: true });
      expect(spy).toHaveBeenCalledWith('contentful-inspector--active', true);
    });
  });
});
