import { Entry } from 'contentful';
import { describe, beforeEach, vi, it, afterEach, Mock, expect } from 'vitest';

import { getAllTaggedEntries } from '../fieldTaggingUtils';
import { EntrySavedMessage, LivePreviewPostMessageMethods } from '../messages';
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
      method: LivePreviewPostMessageMethods.ENTRY_SAVED,
      entityReferenceMap: new Map(),
      contentType,
      entity: entry,
    } as EntrySavedMessage);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not call the subscription if the received entry is not on the page', () => {
    const callback = vi.fn();
    const entry = { sys: { id: '2' } } as Entry;

    const saveEvent = new SaveEvent({ locale });
    saveEvent.subscribe(callback);
    saveEvent.receiveMessage({
      method: LivePreviewPostMessageMethods.ENTRY_SAVED,
      entityReferenceMap: new Map(),
      contentType,
      entity: entry,
    } as EntrySavedMessage);

    expect(callback).not.toHaveBeenCalled();
  });
});
