// @vitest-environment jsdom
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContentfulFieldTagging } from '../field-tagging';

describe('FieldTagging', () => {
  let fieldTagging: ContentfulFieldTagging;

  beforeEach(() => {
    fieldTagging = new ContentfulFieldTagging();
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
