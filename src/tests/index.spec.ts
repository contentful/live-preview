// @vitest-environment jsdom
import { describe, it, expect, vi, Mock, afterEach, beforeEach, beforeAll } from 'vitest';
import { ContentfulLivePreview } from '../index';
import { TagAttributes } from '../types';

import { ContentfulFieldTagging } from '../field-tagging';
import { ContentfulLiveUpdates } from '../live-updates';

vi.mock('../field-tagging');
vi.mock('../live-updates');

describe('ContentfulLivePreview', () => {
  const receiveMessageTagging = vi.fn();
  const receiveMessageUpdates = vi.fn();
  const subscribe = vi.fn();

  (ContentfulFieldTagging as Mock).mockImplementation(() => ({
    receiveMessage: receiveMessageTagging,
  }));
  (ContentfulLiveUpdates as Mock).mockImplementation(() => ({
    receiveMessage: receiveMessageUpdates,
    subscribe,
  }));

  ContentfulLivePreview.init();

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('init', () => {
    describe('should bind the message listeners', () => {
      it('provide the data to FieldTagging and LiveUpdates', () => {
        const data = { from: 'live-preview', value: 'any' };
        window.dispatchEvent(new MessageEvent('message', { data }));

        expect(receiveMessageTagging).toHaveBeenCalledTimes(1);
        expect(receiveMessageTagging).toHaveBeenCalledWith(data);
        expect(receiveMessageUpdates).toHaveBeenCalledTimes(1);
        expect(receiveMessageUpdates).toHaveBeenCalledWith(data);
      });

      it('doenst call the FieldTagging and LiveUpdates for invalid events', () => {
        // Not from live-preview
        window.dispatchEvent(
          new MessageEvent('message', { data: { from: 'anywhere', value: 'any' } })
        );

        // Invalid data
        window.dispatchEvent(new MessageEvent('message', { data: 'just a string' }));
        window.dispatchEvent(new MessageEvent('message', { data: null }));

        expect(receiveMessageTagging).not.toHaveBeenCalled();
        expect(receiveMessageUpdates).not.toHaveBeenCalled();
      });
    });
  });

  describe('subscribe', () => {
    it('should subscribe to changes from ContentfulLiveUpdates', () => {
      const callback = vi.fn();
      const data = { entity: {} };
      ContentfulLivePreview.subscribe(data, 'en-US', callback);

      // Check that the ContentfulLiveUpdates.subscribe was called correctly
      expect(subscribe).toHaveBeenCalledOnce();
      expect(subscribe).toHaveBeenCalledWith(data, 'en-US', callback);

      // Updates from the subscribe fn will trigger the callback
      subscribe.mock.lastCall?.at(-1)({ entity: { title: 'Hello' } });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ entity: { title: 'Hello' } });
    });
  });

  describe('getProps', () => {
    it('returns the expected props with a given entryId, fieldId and locale', () => {
      const entryId = 'test-entry-id';
      const fieldId = 'test-field-id';
      const locale = 'test-locale';

      const result = ContentfulLivePreview.getProps({
        entryId,
        fieldId,
        locale,
      });

      expect(result).toStrictEqual({
        [TagAttributes.FIELD_ID]: fieldId,
        [TagAttributes.ENTRY_ID]: entryId,
        [TagAttributes.LOCALE]: locale,
      });
    });
  });
});
