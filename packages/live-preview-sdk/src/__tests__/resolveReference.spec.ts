/* @vitest-environment jsdom */
import { EditorEntityStore } from '@contentful/visual-sdk';
import type { Asset, Entry } from 'contentful';
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
        file: { fileName: 'abc.jpg' },
      },
      sys: {
        id: '1',
      },
    } as unknown as Asset;

    const expected = {
      reference: {
        fields: {
          file: { fileName: 'abc.jpg' },
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
      expect(result.reference.fields).toEqual(cdaAsset.fields);
    });
  });

  describe('entries', () => {
    const entry = {
      fields: {
        title: 'Hello World',
      },
      sys: {
        id: '1',
        contentType: {
          sys: { id: 'helloWorld' },
        },
      },
    } as unknown as Entry;

    const expected = {
      reference: {
        fields: {
          title: 'Hello World',
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
      expect(result.reference.fields).toEqual(cdaEntry.fields);
    });
  });
});
