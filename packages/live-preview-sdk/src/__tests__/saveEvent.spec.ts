import { Entry } from 'contentful';
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAllTaggedEntries } from '../fieldTaggingUtils';
import { LivePreviewPostMessageMethods, MessageFromEditor } from '../messages';
import { SaveEvent } from '../saveEvent';
import { ContentType } from '../types';

vi.mock('../fieldTaggingUtils');

describe('SaveEvent', () => {
  const locale = 'en-US';
  const contentType = {} as ContentType;

  beforeEach(() => {
    (getAllTaggedEntries as Mock).mockReturnValue(['1']);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call the subscription if the received entry is on the page', () => {
    const callback = vi.fn();
    const entry = { sys: { id: '1' } } as Entry;

    const saveEvent = new SaveEvent({ locale });
    saveEvent.subscribe(callback);
    saveEvent.receiveMessage({
      data: {},
      method: LivePreviewPostMessageMethods.ENTRY_SAVED,
      contentType,
      entity: entry,
    } as unknown as Omit<MessageFromEditor, 'from' | 'source'>);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not call the subscription if the received entry is not on the page', () => {
    const callback = vi.fn();
    const entry = { sys: { id: '2' } } as Entry;

    const saveEvent = new SaveEvent({ locale });
    saveEvent.subscribe(callback);
    saveEvent.receiveMessage({
      method: LivePreviewPostMessageMethods.ENTRY_SAVED,
      contentType,
      entity: entry,
    } as unknown as Omit<MessageFromEditor, 'from' | 'source'>);

    expect(callback).not.toHaveBeenCalled();
  });
});
