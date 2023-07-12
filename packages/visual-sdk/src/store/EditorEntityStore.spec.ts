import type { Asset, Entry } from 'contentful';

import assetJSON from '../__test__/fixtures/asset.json';
import entryJSON from '../__test__/fixtures/entry.json';
import { EditorEntityStore, PostMessageMethods } from './EditorEntityStore';

describe('EditorEntityStore', () => {
  const locale = 'en-US';

  const asset = assetJSON as Asset;
  const entry = entryJSON as Entry;
  const entities = [entry, asset];

  const editorAsset = {
    ...asset,
    sys: {
      ...asset.sys,
      id: 'editor-asset-1',
    },
  };

  const editorEntry = {
    ...entry,
    sys: {
      ...entry.sys,
      id: 'editor-entry-1',
    },
  };

  const sendMessage = jest.fn();
  const subscribe = jest.fn().mockReturnValue(() => {
    /* unsubscribe */
  });

  function resolveEntries(
    id: string,
    entityType: 'Asset' | 'Entry',
    entities: Array<Entry | Asset>
  ) {
    // First it calls sendMessage to request the entity
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(PostMessageMethods.REQUEST_ENTITIES, {
      entityIds: [id],
      entityType: entityType,
      locale: locale,
    });

    // Then it registers the listener to wait for a respsone
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledWith(
      PostMessageMethods.REQUESTED_ENTITIES,
      expect.any(Function)
    );

    // Let it resolve
    subscribe.mock.lastCall[1]({ entities });
  }

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  const createStore = () => new EditorEntityStore({ entities, locale, sendMessage, subscribe });

  it('should create a new instance', () => {
    const store = new EditorEntityStore({ entities: [], locale, sendMessage, subscribe });
    expect(store).toBeDefined();
  });

  it('should create a new instance with initial state', () => {
    expect(createStore().entities).toEqual(entities);
  });

  describe('fetchAsset', () => {
    it('should return the asset from the store', async () => {
      const result = await createStore().fetchAsset(asset.sys.id);
      expect(result).toEqual(asset);
    });

    it('should request the asset from the editor and persist it to the store', async () => {
      const store = createStore();
      const promise = store.fetchAsset(editorAsset.sys.id);

      resolveEntries(editorAsset.sys.id, 'Asset', [editorAsset]);

      const result = await promise;

      expect(result).toEqual(editorAsset);
      expect(store.entities).toHaveLength(entities.length + 1);

      // fetch again to see if it's now used from the store
      const resultFromStore = await store.fetchAsset(editorAsset.sys.id);
      expect(resultFromStore).toEqual(result);
      expect(sendMessage).toHaveBeenCalledTimes(1);
    });

    it('should return undefined if the requested asset does not exist', async () => {
      const promise = createStore().fetchAsset('unknown');
      resolveEntries('unknown', 'Asset', []);
      jest.advanceTimersByTime(3000);
      const result = await promise;

      expect(result).toBeUndefined();
    });
  });

  describe('fetchAssets', () => {
    it('should return the assets from the store', async () => {
      const result = await createStore().fetchAssets([asset.sys.id]);
      expect(result).toEqual([asset]);
    });

    it('should return the assets from the store and request missing ones', async () => {
      const promise = createStore().fetchAssets([asset.sys.id, editorAsset.sys.id]);
      resolveEntries(editorAsset.sys.id, 'Asset', [editorAsset]);
      const result = await promise;
      expect(result).toEqual([asset, editorAsset]);
    });

    it('should throw an error if one of the requested assets does not exist', async () => {
      expect.assertions(1);

      const promise = createStore().fetchAssets(['unknown', asset.sys.id]);
      jest.advanceTimersByTime(3000);

      await expect(promise).rejects.toThrowError();
    });
  });

  describe('fetchEntry', () => {
    it('should return the entry from the store', async () => {
      const result = await createStore().fetchEntry(entry.sys.id);
      expect(result).toEqual(entry);
    });

    it('should request the entry from the editor and persist it to the store', async () => {
      const store = createStore();
      const promise = store.fetchEntry(editorEntry.sys.id);

      resolveEntries(editorEntry.sys.id, 'Entry', [editorEntry]);

      const result = await promise;

      expect(result).toEqual(editorEntry);
      expect(store.entities).toHaveLength(entities.length + 1);

      // fetch again to see if it's now used from the store
      const resultFromStore = await store.fetchAsset(editorEntry.sys.id);
      expect(resultFromStore).toEqual(result);
      expect(sendMessage).toHaveBeenCalledTimes(1);
    });

    it('should return undefined if the requested entry does not exist', async () => {
      const promise = createStore().fetchEntry('unknown');
      resolveEntries('unknown', 'Entry', []);
      jest.advanceTimersByTime(3000);
      const result = await promise;

      expect(result).toBeUndefined();
    });
  });

  describe('fetchEntries', () => {
    it('should return the entries from the store', async () => {
      const result = await createStore().fetchEntries([entry.sys.id]);
      expect(result).toEqual([entry]);
    });

    it('should return the assets from the store and request missing ones', async () => {
      const promise = createStore().fetchEntries([entry.sys.id, editorEntry.sys.id]);
      resolveEntries(editorEntry.sys.id, 'Entry', [editorEntry]);
      const result = await promise;
      expect(result).toEqual([entry, editorEntry]);
    });

    it('should throw an error if one of the requested entries does not exist', async () => {
      expect.assertions(1);

      const promise = createStore().fetchAssets(['unknown', entry.sys.id]);
      jest.advanceTimersByTime(3000);

      await expect(promise).rejects.toThrowError();
    });
  });
});
