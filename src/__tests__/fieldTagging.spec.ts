// @vitest-environment jsdom
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

import { FieldTagging } from '../fieldTagging';

describe('FieldTagging', () => {
  let fieldTagging: FieldTagging;

  beforeEach(() => {
    fieldTagging = new FieldTagging();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('receiveMessage', () => {
    test("shouldn't change anything if the incoming message doesnt contain 'isInspectorActive'", () => {
      const spy = vi.spyOn(document.body.classList, 'toggle');
      fieldTagging.receiveMessage({ entitiy: {} });
      expect(spy).not.toHaveBeenCalled();
    });

    test('should toggle "contentful-inspector--active" class on document.body based on value of isInspectorActive', () => {
      const spy = vi.spyOn(document.body.classList, 'toggle');
      fieldTagging.receiveMessage({ from: 'live-preview', isInspectorActive: true });
      expect(spy).toHaveBeenCalledWith('contentful-inspector--active', true);
    });
  });
});
