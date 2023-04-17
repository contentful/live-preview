import { describe, it, vi, expect } from 'vitest';

import { clone } from '../helpers';
import { LiveUpdates } from '../liveUpdates';
import assetFromEntryEditor from './fixtures/assetFromEntryEditor.json';
import landingPageContentType from './fixtures/landingPageContentType.json';
import nestedCollectionFromPreviewApp from './fixtures/nestedCollectionFromPreviewApp.json';
import nestedDataFromPreviewApp from './fixtures/nestedDataFromPreviewApp.json';
import pageInsideCollectionFromEntryEditor from './fixtures/pageInsideCollectionFromEntryEditor.json';

describe('LiveUpdates', () => {
  const contentType = {
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
  };
  const locale = 'en-US';
  const updateFromEntryEditor1 = { sys: { id: '1' }, fields: { title: { [locale]: 'Data 2' } } };
  const updateFromEntryEditor2 = { sys: { id: '1' }, fields: { title: { [locale]: 'Data 3' } } };

  it('should listen to changes and calls the subscribed handlers', () => {
    const liveUpdates = new LiveUpdates();
    const data = { sys: { id: '1' }, title: 'Data 1', __typename: 'Demo' };
    const cb = vi.fn();
    liveUpdates.subscribe(data, locale, cb);

    liveUpdates.receiveMessage({ entity: updateFromEntryEditor1, contentType });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith({
      ...data,
      title: 'Data 2',
    });

    liveUpdates.receiveMessage({ entity: updateFromEntryEditor2, contentType });

    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenCalledWith({
      ...data,
      title: 'Data 3',
    });
  });

  it('no longer receives updates after unsubcribing', () => {
    const liveUpdates = new LiveUpdates();
    const data = { sys: { id: '1' }, title: 'Data 1', __typename: 'Demo' };
    const contentType = { fields: [] };
    const cb = vi.fn();
    const unsubscribe = liveUpdates.subscribe(data, locale, cb);

    liveUpdates.receiveMessage({ entity: updateFromEntryEditor1, contentType });

    expect(cb).toHaveBeenCalledTimes(1);

    unsubscribe();

    liveUpdates.receiveMessage({ entity: updateFromEntryEditor2, contentType });

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('ignores invalid messages', () => {
    const liveUpdates = new LiveUpdates();
    const data = { sys: { id: '1' }, title: 'Data 1' };
    const cb = vi.fn();
    liveUpdates.subscribe(data, locale, cb);

    liveUpdates.receiveMessage({ isInspectorActive: false });

    expect(cb).not.toHaveBeenCalled();
  });

  it('doesnt call the subscribe handler if the data was not updated', () => {
    const liveUpdates = new LiveUpdates();
    const data = { sys: { id: '99' }, title: 'Data 1', __typename: 'Demo' };
    const cb = vi.fn();
    liveUpdates.subscribe(data, locale, cb);

    liveUpdates.receiveMessage({ entity: updateFromEntryEditor1, contentType });

    expect(cb).not.toHaveBeenCalled();
  });

  it('merges nested field updates', () => {
    const liveUpdates = new LiveUpdates();
    const cb = vi.fn();
    liveUpdates.subscribe(nestedDataFromPreviewApp, locale, cb);
    liveUpdates.receiveMessage({ entity: assetFromEntryEditor });

    const expected = clone(nestedDataFromPreviewApp);
    expected.featuredImage.title = assetFromEntryEditor.fields.title[locale];
    (expected.featuredImage.description as string | null) =
      assetFromEntryEditor.fields.description[locale];

    expect(cb).toHaveBeenCalledWith(expected);
  });

  it('merges nested collections', () => {
    const liveUpdates = new LiveUpdates();
    const cb = vi.fn();
    liveUpdates.subscribe(nestedCollectionFromPreviewApp, locale, cb);
    liveUpdates.receiveMessage({
      entity: pageInsideCollectionFromEntryEditor,
      contentType: landingPageContentType,
    });

    const expected = clone(nestedCollectionFromPreviewApp);
    expected.items[0].menuItemsCollection.items[2].featuredPagesCollection.items[1].pageName =
      pageInsideCollectionFromEntryEditor.fields.pageName[locale];
    expected.items[0].menuItemsCollection.items[2].featuredPagesCollection.items[1].slug =
      pageInsideCollectionFromEntryEditor.fields.slug[locale];

    expect(cb).toHaveBeenCalledWith(expected);
  });
});
