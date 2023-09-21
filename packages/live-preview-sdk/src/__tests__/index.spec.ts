// @vitest-environment jsdom
import { describe, it, expect, vi, Mock, afterEach, beforeAll } from 'vitest';

import { sendMessageToEditor, isInsideIframe } from '../helpers';
import { ContentfulLivePreview } from '../index';
import { InspectorMode } from '../inspectorMode';
import { LiveUpdates } from '../liveUpdates';
import { SaveEvent } from '../saveEvent';
import { TagAttributes } from '../types';

vi.mock('../inspectorMode');
vi.mock('../liveUpdates');
vi.mock('../saveEvent');
vi.mock('../helpers');

describe('ContentfulLivePreview', () => {
  const receiveMessageInspectorMode = vi.fn();
  const receiveMessageLiveUpdates = vi.fn();
  const receiveMessageSaveEvent = vi.fn();
  const subscribeToLiveUpdates = vi.fn();
  const subscribeToSaveEvent = vi.fn();

  (InspectorMode as Mock).mockImplementation(() => ({
    receiveMessage: receiveMessageInspectorMode,
    getTaggedElements: vi.fn(() => []),
  }));
  (LiveUpdates as Mock).mockImplementation(() => ({
    receiveMessage: receiveMessageLiveUpdates,
    subscribe: subscribeToLiveUpdates,
  }));
  (SaveEvent as Mock).mockImplementation(() => ({
    receiveMessage: receiveMessageSaveEvent,
    subscribe: subscribeToSaveEvent,
  }));

  beforeAll(() => {
    (isInsideIframe as Mock).mockReturnValue(true);

    ContentfulLivePreview.init({ locale: 'en-US' });
    // establish the connection, needs to tested here, as we can only init the ContentfulLivePreview once
    expect(sendMessageToEditor).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('init', () => {
    describe('should bind the message listeners', () => {
      it('provide the data to InspectorMode and LiveUpdates', () => {
        const data = { from: 'live-preview', value: 'any' };
        window.dispatchEvent(new MessageEvent('message', { data }));

        expect(receiveMessageInspectorMode).toHaveBeenCalledTimes(1);
        expect(receiveMessageInspectorMode).toHaveBeenCalledWith(data);
        expect(receiveMessageLiveUpdates).toHaveBeenCalledTimes(1);
        expect(receiveMessageLiveUpdates).toHaveBeenCalledWith(data);
      });

      it('doenst call the InspectorMode and LiveUpdates for invalid events', () => {
        // Not from live-preview
        window.dispatchEvent(
          new MessageEvent('message', { data: { from: 'anywhere', value: 'any' } })
        );

        // Invalid data
        window.dispatchEvent(new MessageEvent('message', { data: 'just a string' }));
        window.dispatchEvent(new MessageEvent('message', { data: null }));

        expect(receiveMessageInspectorMode).not.toHaveBeenCalled();
        expect(receiveMessageLiveUpdates).not.toHaveBeenCalled();
      });
    });
  });

  describe('subscribe', () => {
    it('should subscribe to changes from LiveUpdates', () => {
      const callback = vi.fn();
      const data = { entity: {} };
      ContentfulLivePreview.subscribe({ data, locale: 'en-US', callback });

      // Check that the LiveUpdates.subscribe was called correctly
      expect(subscribeToLiveUpdates).toHaveBeenCalledOnce();
      expect(subscribeToLiveUpdates).toHaveBeenCalledWith({
        data,
        locale: 'en-US',
        callback,
      });

      // Updates from the subscribe fn will trigger the callback
      subscribeToLiveUpdates.mock.lastCall?.[0].callback({ entity: { title: 'Hello' } });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ entity: { title: 'Hello' } });
    });

    it('should subscribe to changes from the save event', () => {
      ContentfulLivePreview.subscribe('save', { callback: vi.fn() });

      expect(subscribeToSaveEvent).toHaveBeenCalledOnce();
    });

    it('should not subscribe to changes if it is disabled', () => {
      ContentfulLivePreview.toggleLiveUpdatesMode();

      const callback = vi.fn();
      const data = { entity: {} };
      ContentfulLivePreview.subscribe({ data, locale: 'en-US', callback });

      // Check that the LiveUpdates.subscribe was called correctly
      expect(subscribeToLiveUpdates).not.toHaveBeenCalled();
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

    it('returns null if it is disabled', () => {
      ContentfulLivePreview.toggleInspectorMode();

      const entryId = 'test-entry-id';
      const fieldId = 'test-field-id';
      const locale = 'test-locale';

      const result = ContentfulLivePreview.getProps({
        entryId,
        fieldId,
        locale,
      });

      expect(result).toBeNull();
    });
  });
});
