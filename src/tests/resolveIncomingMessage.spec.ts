// @vitest-environment jsdom
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import FieldTagging from '../field-tagging';

describe('resolveIncomingMessage', () => {
  let fieldTagging: FieldTagging;

  beforeEach(() => {
    fieldTagging = new FieldTagging();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should return if incoming data doesnt contain isInspectorActive', () => {
    const spy = vi.spyOn(document.body.classList, 'toggle');
    fieldTagging['bindIncommingMessage']({ entitiy: {} });
    expect(spy).not.toHaveBeenCalled();
  });

  test('should toggle "contentful-inspector--active" class on document.body based on value of isInspectorActive', () => {
    const spy = vi.spyOn(document.body.classList, 'toggle');
    fieldTagging['bindIncommingMessage']({ from: 'live-preview', isInspectorActive: true });
    expect(spy).toHaveBeenCalledWith('contentful-inspector--active', true);
  });
});
