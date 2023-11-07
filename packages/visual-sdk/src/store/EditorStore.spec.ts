import type { Asset, Entry } from 'contentful';

import assetJSON from '../__test__/fixtures/asset.json';
import entryJSON from '../__test__/fixtures/entry.json';
import { EntityStore } from './EntityStore';

describe('EntityStore', () => {
  const locale = 'en-US';

  const asset = assetJSON as Asset;
  const entry = entryJSON as Entry;
  const entities = [entry, asset];

  const createStore = () => new EntityStore({ entities, locale });

  it('should create a new instance', () => {
    const store = new EntityStore({ entities: [], locale });
    expect(store).toBeDefined();
  });

  it('should create a new instance with initial state', () => {
    expect(createStore().entities).toEqual(entities);
  });

  it('prevents id collision for assets and entries', async () => {
    const patchedAsset = { ...asset, sys: { ...asset.sys, id: '1' } };
    const patchedEntry = { ...entry, sys: { ...entry.sys, id: '1' } };

    const store = new EntityStore({ entities: [patchedAsset, patchedEntry], locale });

    const [resolvedAsset, resolvedEntry] = await Promise.all([
      store.fetchAsset('1'),
      store.fetchEntry('1'),
    ]);

    expect(resolvedAsset).toEqual(patchedAsset);
    expect(resolvedEntry).toEqual(patchedEntry);
  });

  describe('getValue', () => {
    it('should return the value based on entityId and path', () => {
      const store = createStore();

      expect(
        store.getValue({ sys: { id: entry.sys.id, linkType: 'Entry', type: 'Link' } }, [
          'fields',
          'title',
        ])
      ).toEqual(entry.fields.title);
      expect(
        store.getValue({ sys: { id: asset.sys.id, linkType: 'Asset', type: 'Link' } }, [
          'fields',
          'title',
        ])
      ).toEqual(asset.fields.title);
    });

    it('should return undefined if entity id does not exist', () => {
      expect(
        createStore().getValue({ sys: { id: 'test', linkType: 'Entry', type: 'Link' } }, [
          'fields',
          'title',
        ])
      ).toBeUndefined();
    });

    it("should return undefined if field doesn't exist", () => {
      expect(
        createStore().getValue({ sys: { id: entry.sys.id, linkType: 'Entry', type: 'Link' } }, [
          'fields',
          'description',
        ])
      ).toBeUndefined();
    });

    it('should return undefined if entity type does not match', () => {
      expect(
        createStore().getValue({ sys: { id: entry.sys.id, linkType: 'Asset', type: 'Link' } }, [
          'fields',
          'title',
        ])
      ).toBeUndefined();
    });
  });

  describe('fetchAsset', () => {
    it('should return the asset from the store', async () => {
      const result = await createStore().fetchAsset(asset.sys.id);
      expect(result).toEqual(asset);
    });

    it('should return undefined if the requested asset is not in the store', async () => {
      const result = await createStore().fetchAsset('unknown');
      expect(result).toBeUndefined();
    });
  });

  describe('fetchAssets', () => {
    it('should return the assets from the store', async () => {
      const result = await createStore().fetchAssets([asset.sys.id]);
      expect(result).toEqual([asset]);
    });

    it('should throw an error if one of the requested assets is not in the store', async () => {
      await expect(createStore().fetchAssets(['unknown', asset.sys.id])).rejects.toThrowError();
    });
  });

  describe('fetchEntry', () => {
    it('should return the entry from the store', async () => {
      const result = await createStore().fetchEntry(entry.sys.id);
      expect(result).toEqual(entry);
    });

    it('should return undefined if the requested entry is not in the store', async () => {
      const result = await createStore().fetchEntry('unknown');
      expect(result).toBeUndefined();
    });
  });

  describe('fetchEntries', () => {
    it('should return the entry from the store', async () => {
      const result = await createStore().fetchEntries([entry.sys.id]);
      expect(result).toEqual([entry]);
    });

    it('should throw an error if one of the requested entries is not in the store', async () => {
      await expect(createStore().fetchAssets(['unknown', entry.sys.id])).rejects.toThrowError();
    });
  });
});
