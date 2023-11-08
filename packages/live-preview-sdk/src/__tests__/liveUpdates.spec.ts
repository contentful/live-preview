// @vitest-environment jsdom
import { Asset, Entry } from 'contentful';
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';

import { LIVE_PREVIEW_EDITOR_SOURCE } from '../constants';
import * as helpers from '../helpers';
import { LiveUpdates } from '../liveUpdates';
import { InspectorModeEventMethods, LivePreviewPostMessageMethods } from '../messages';
import { ContentType } from '../types';
import assetFromEntryEditor from './fixtures/assetFromEntryEditor.json';
import landingPageContentType from './fixtures/landingPageContentType.json';
import nestedCollectionFromPreviewApp from './fixtures/nestedCollectionFromPreviewApp.json';
import nestedDataFromPreviewApp from './fixtures/nestedDataFromPreviewApp.json';
import pageInsideCollectionFromEntryEditor from './fixtures/pageInsideCollectionFromEntryEditor.json';

vi.mock('../helpers/debug');

describe('LiveUpdates', () => {
  const sendMessage = vi.spyOn(helpers, 'sendMessageToEditor');

  const contentType = {
    sys: { id: 'Test' },
    fields: [
      {
        id: 'WHxL83oMXaLL53LK',
        apiName: 'title',
        name: 'title',
        type: 'Symbol',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
      },
    ],
  } as unknown as ContentType;

  const locale = 'en-US';
  const updateFromEntryEditor1 = {
    sys: { id: '1' },
    fields: { title: 'Data 2' },
  } as unknown as Entry;
  const updateFromEntryEditor2 = {
    sys: { id: '1' },
    fields: { title: 'Data 3' },
  } as unknown as Entry;

  const targetOrigin = ['https://app.contentful.com'];

  beforeEach(() => {
    sendMessage.mockImplementation(() => {
      // noop
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should listen to changes and calls the subscribed handlers', async () => {
    const liveUpdates = new LiveUpdates({ locale, targetOrigin });
    const data = { sys: { id: '1' }, title: 'Data 1', __typename: 'Demo' };
    const callback = vi.fn();
    liveUpdates.subscribe({ data, callback });

    await liveUpdates.receiveMessage({
      entity: updateFromEntryEditor1,
      contentType,
      action: LivePreviewPostMessageMethods.ENTRY_UPDATED,
      from: 'live-preview',
      method: LivePreviewPostMessageMethods.ENTRY_UPDATED,
      source: LIVE_PREVIEW_EDITOR_SOURCE,
      entityReferenceMap: new Map(),
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({
      ...data,
      title: 'Data 2',
    });

    await liveUpdates.receiveMessage({
      entity: updateFromEntryEditor2,
      contentType,
      action: LivePreviewPostMessageMethods.ENTRY_UPDATED,
      from: 'live-preview',
      method: LivePreviewPostMessageMethods.ENTRY_UPDATED,
      source: LIVE_PREVIEW_EDITOR_SOURCE,
      entityReferenceMap: new Map(),
    });

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith({
      ...data,
      title: 'Data 3',
    });
  });

  describe('invalid subscription data', () => {
    it('should notify because sys information is missing', () => {
      const liveUpdates = new LiveUpdates({ locale, targetOrigin });
      const data = { title: 'Data 1', __typename: 'Demo' };
      const callback = vi.fn();

      liveUpdates.subscribe({ data, callback });

      expect(helpers.debug.error).toHaveBeenCalledWith(
        'Live Updates requires the "sys.id" to be present on the provided data',
        data
      );
    });
  });

  it('no longer receives updates after unsubcribing', async () => {
    const liveUpdates = new LiveUpdates({ locale, targetOrigin });
    const data = { sys: { id: '1' }, title: 'Data 1', __typename: 'Demo' };
    const callback = vi.fn();
    const unsubscribe = liveUpdates.subscribe({ data, callback });

    await liveUpdates.receiveMessage({
      entity: updateFromEntryEditor1,
      contentType,
      action: LivePreviewPostMessageMethods.ENTRY_UPDATED,
      from: 'live-preview',
      method: LivePreviewPostMessageMethods.ENTRY_UPDATED,
      source: LIVE_PREVIEW_EDITOR_SOURCE,
      entityReferenceMap: new Map(),
    });

    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();

    await liveUpdates.receiveMessage({
      entity: updateFromEntryEditor2,
      contentType,
      action: LivePreviewPostMessageMethods.ENTRY_UPDATED,
      from: 'live-preview',
      method: LivePreviewPostMessageMethods.ENTRY_UPDATED,
      source: LIVE_PREVIEW_EDITOR_SOURCE,
      entityReferenceMap: new Map(),
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('ignores invalid messages', async () => {
    const liveUpdates = new LiveUpdates({ locale, targetOrigin });
    const data = { sys: { id: '1' }, title: 'Data 1', __typename: 'Demo' };
    const callback = vi.fn();
    liveUpdates.subscribe({ data, callback });

    await liveUpdates.receiveMessage({
      isInspectorActive: false,
      action: InspectorModeEventMethods.INSPECTOR_MODE_CHANGED,
      method: InspectorModeEventMethods.INSPECTOR_MODE_CHANGED,
      from: 'live-preview',
      source: LIVE_PREVIEW_EDITOR_SOURCE,
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('doesnt call the subscribe handler if the data was not updated', () => {
    const liveUpdates = new LiveUpdates({ locale, targetOrigin });
    const data = { sys: { id: '99' }, title: 'Data 1', __typename: 'Demo' };
    const callback = vi.fn();
    liveUpdates.subscribe({ data, locale, callback });

    liveUpdates.receiveMessage({
      entity: updateFromEntryEditor1,
      contentType,
      action: LivePreviewPostMessageMethods.ENTRY_UPDATED,
      from: 'live-preview',
      method: LivePreviewPostMessageMethods.ENTRY_UPDATED,
      source: LIVE_PREVIEW_EDITOR_SOURCE,
      entityReferenceMap: new Map(),
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('merges nested field updates', async () => {
    const liveUpdates = new LiveUpdates({ locale, targetOrigin });
    const callback = vi.fn();
    liveUpdates.subscribe({ data: nestedDataFromPreviewApp, callback });
    await liveUpdates.receiveMessage({
      entity: assetFromEntryEditor as unknown as Asset,
      action: LivePreviewPostMessageMethods.ENTRY_UPDATED,
      from: 'live-preview',
      method: LivePreviewPostMessageMethods.ENTRY_UPDATED,
      source: LIVE_PREVIEW_EDITOR_SOURCE,
      entityReferenceMap: new Map(),
      contentType: {} as unknown as ContentType,
    });

    const expected = helpers.clone(nestedDataFromPreviewApp);
    expected.featuredImage.title = assetFromEntryEditor.fields.title;
    (expected.featuredImage.description as string | null) = assetFromEntryEditor.fields.description;

    expect(callback).toHaveBeenCalledWith(expected);
  });

  it('merges nested collections', async () => {
    const liveUpdates = new LiveUpdates({ locale, targetOrigin });
    const callback = vi.fn();
    liveUpdates.subscribe({
      data: nestedCollectionFromPreviewApp,
      callback,
    });
    await liveUpdates.receiveMessage({
      entity: pageInsideCollectionFromEntryEditor as unknown as Entry,
      contentType: landingPageContentType as unknown as ContentType,
      action: LivePreviewPostMessageMethods.ENTRY_UPDATED,
      from: 'live-preview',
      method: LivePreviewPostMessageMethods.ENTRY_UPDATED,
      source: LIVE_PREVIEW_EDITOR_SOURCE,
      entityReferenceMap: new Map(),
    });

    const expected = helpers.clone(nestedCollectionFromPreviewApp);
    // updated fields
    expected.items[0].menuItemsCollection.items[2].featuredPagesCollection.items[1].pageName =
      pageInsideCollectionFromEntryEditor.fields.pageName;
    expected.items[0].menuItemsCollection.items[2].featuredPagesCollection.items[1].slug =
      pageInsideCollectionFromEntryEditor.fields.slug;
    // new fields
    (
      expected.items[0].menuItemsCollection.items[2].featuredPagesCollection.items[1] as any
    ).internalName = 'Testing';
    (
      expected.items[0].menuItemsCollection.items[2].featuredPagesCollection.items[1] as any
    ).extraSectionCollection = { items: [] };
    (expected.items[0].menuItemsCollection.items[2].featuredPagesCollection.items[1] as any).seo =
      null;
    (
      expected.items[0].menuItemsCollection.items[2].featuredPagesCollection.items[1] as any
    ).topSectionCollection = { items: [] };

    expect(callback).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(expected);
  });

  describe('sendMessageToEditor', () => {
    it('sends a message to the editor for a subscription with GQL data', () => {
      const liveUpdates = new LiveUpdates({ locale, targetOrigin });
      const data = { sys: { id: '1' }, title: 'Data 1', __typename: 'Demo' };
      const callback = vi.fn();
      liveUpdates.subscribe({ data, callback });

      expect(sendMessage).toHaveBeenCalledTimes(1);
      expect(sendMessage).toHaveBeenCalledWith(
        LivePreviewPostMessageMethods.SUBSCRIBED,
        {
          action: LivePreviewPostMessageMethods.SUBSCRIBED,
          type: 'GQL',
          locale,
          entryId: '1',
          event: 'edit',
        },
        ['https://app.contentful.com']
      );
    });

    it('sends a message to the editor for a subscription with REST data', () => {
      const liveUpdates = new LiveUpdates({ locale, targetOrigin });
      const data = { sys: { id: '1' }, fields: { title: 'Data 1' } };
      const callback = vi.fn();
      liveUpdates.subscribe({ data, callback });

      expect(sendMessage).toHaveBeenCalledTimes(1);
      expect(sendMessage).toHaveBeenCalledWith(
        LivePreviewPostMessageMethods.SUBSCRIBED,
        {
          action: LivePreviewPostMessageMethods.SUBSCRIBED,
          type: 'REST',
          locale,
          entryId: '1',
          event: 'edit',
        },
        ['https://app.contentful.com']
      );
    });
  });

  describe('restore', () => {
    const id = 'abc123';
    const data = { sys: { id }, title: 'Title', __typename: 'Foo' };
    const subscription = {
      data,
      locale,
      callback: vi.fn(),
      event: 'edit',
      sysId: id,
    };
    const liveUpdates = new LiveUpdates({ locale, targetOrigin });

    beforeEach(() => {
      liveUpdates.subscribe(subscription);
      vi.clearAllMocks();
    });

    it('should restore a single entity', () => {
      liveUpdates['subscriptions'].set(id, subscription);
      liveUpdates['storage'].set(id, locale, { ...data, title: 'Title from storage' });
      liveUpdates['restore'](data, locale, id);
      const restoredData = { ...data, title: 'Title from storage' };
      expect(subscription.callback).toHaveBeenCalledTimes(1);
      expect(subscription.callback).toHaveBeenCalledWith(restoredData);
    });

    it('should not call the callback if the data is not in storage', () => {
      liveUpdates['restore'](subscription.data, locale, '1');

      expect(subscription.callback).not.toHaveBeenCalled();
    });
  });
});
