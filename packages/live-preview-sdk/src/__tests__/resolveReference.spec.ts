/* @vitest-environment jsdom */
import { EditorEntityStore } from '@contentful/visual-sdk';
import type { AssetProps, EntryProps } from 'contentful-management';
import { describe, vi, it, beforeEach, afterEach, expect, Mock } from 'vitest';

import { resolveReference } from '../helpers/resolveReference';
import cdaAsset from './fixtures/cdaAsset.json';
import cdaEntry from './fixtures/cdaEntry.json';

vi.mock('@contentful/visual-sdk');

describe('resolveReference', () => {
  const locale = 'en-US';

  beforeEach(() => {
    (EditorEntityStore as Mock).mockImplementation(() => ({
      __mocked__: true,
      fetchEntry: async () => cdaEntry,
      fetchAsset: async () => cdaAsset,
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('asset', () => {
    const asset = {
      fields: {
        file: { [locale]: { fileName: 'abc.jpg' } },
      },
      sys: {
        id: '1',
      },
    } as unknown as AssetProps;

    const expected = {
      reference: {
        fields: {
          file: {
            [locale]: {
              fileName: 'abc.jpg',
            },
          },
        },
        sys: {
          id: '1',
        },
      },
      typeName: 'Asset',
    };

    it('resolves it directly from the map', async () => {
      const result = await resolveReference({
        entityReferenceMap: new Map([['1', asset]]),
        referenceId: '1',
        locale,
      });

      expect(result).toEqual(expected);
    });

    it('resolves it from the editor', async () => {
      const result = await resolveReference({
        entityReferenceMap: new Map(),
        referenceId: cdaAsset.sys.id,
        isAsset: true,
        locale,
      });

      expect(result.typeName).toBe('Asset');
      expect(result.reference.fields).toEqual({
        title: { [locale]: cdaAsset.fields.title },
        file: { [locale]: cdaAsset.fields.file },
      });
    });
  });

  describe('entries', () => {
    const entry = {
      fields: {
        title: { 'en-US': 'Hello World' },
      },
      sys: {
        id: '1',
        contentType: {
          sys: { id: 'helloWorld' },
        },
      },
    } as unknown as EntryProps;

    const expected = {
      reference: {
        fields: {
          title: {
            'en-US': 'Hello World',
          },
        },
        sys: {
          id: '1',
          contentType: {
            sys: { id: 'helloWorld' },
          },
        },
      },
      typeName: 'HelloWorld',
    };

    it('resolves it directly from the map', async () => {
      const result = await resolveReference({
        entityReferenceMap: new Map([['1', entry]]),
        referenceId: '1',
        locale,
      });

      expect(result).toEqual(expected);
    });

    it('resolves it from the editor', async () => {
      const result = await resolveReference({
        entityReferenceMap: new Map(),
        referenceId: cdaEntry.sys.id,
        locale,
      });

      expect(result.typeName).toBe('TopicProductFeature');
      expect(result.reference.fields).toEqual({
        internalName: { [locale]: cdaEntry.fields.internalName },
        longDescription: { [locale]: cdaEntry.fields.longDescription },
        name: { [locale]: cdaEntry.fields.name },
        shortDescription: { [locale]: cdaEntry.fields.shortDescription },
      });
    });
  });
});
