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
  test('should return if incoming data is not an object', () => {
    const spy = vi.spyOn(document.body.classList, 'toggle');
    fieldTagging['resolveIncomingMessage']('not an object' as unknown as MessageEvent);
    expect(spy).not.toHaveBeenCalled();
  });

  test('should return if incoming message is not from live preview', () => {
    const spy = vi.spyOn(document.body.classList, 'toggle');
    fieldTagging['resolveIncomingMessage']({
      data: { from: 'not-live-preview' },
    } as unknown as MessageEvent);
    expect(spy).not.toHaveBeenCalled();
  });

  test('should toggle "contentful-inspector--active" class on document.body based on value of isInspectorActive', () => {
    const spy = vi.spyOn(document.body.classList, 'toggle');
    fieldTagging['resolveIncomingMessage']({
      data: { from: 'live-preview', isInspectorActive: true },
    } as unknown as MessageEvent);
    expect(spy).toHaveBeenCalledWith('contentful-inspector--active', true);
  });
});
