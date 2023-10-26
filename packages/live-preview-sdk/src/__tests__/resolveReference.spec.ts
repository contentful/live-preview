/* @vitest-environment jsdom */
import { EditorEntityStore } from '@contentful/visual-sdk';
import { describe, vi, it, beforeEach, afterEach, expect, Mock } from 'vitest';

import { resolveReference } from '../helpers/resolveReference';
import cdaAsset from './fixtures/cdaAsset.json';
import cdaEntry from './fixtures/cdaEntry.json';
import type { GetStore } from '../types';

vi.mock('@contentful/visual-sdk');

describe('resolveReference', () => {
  const locale = 'en-US';
  const getStore = vi.fn<Parameters<GetStore>, ReturnType<GetStore>>();
  let store: EditorEntityStore;

  beforeEach(() => {
    (EditorEntityStore as Mock).mockImplementation(() => ({
      __mocked__: true,
      fetchEntry: async () => cdaEntry,
      fetchAsset: async () => cdaAsset,
    }));

    store = new EditorEntityStore({
      entities: [],
      locale,
      sendMessage: vi.fn(),
      subscribe: vi.fn(),
      timeoutDuration: 10,
    });

    getStore.mockImplementation(() => store);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('resolves an assets correctly from the store', async () => {
    const result = await resolveReference({
      referenceId: cdaAsset.sys.id,
      isAsset: true,
      locale,
      getStore,
    });

    expect(result.typeName).toBe('Asset');
    expect(result.reference.fields).toEqual(cdaAsset.fields);
  });

  it('resolves an entry correctly from the store', async () => {
    const result = await resolveReference({
      referenceId: cdaEntry.sys.id,
      locale,
      getStore,
    });

    expect(result.typeName).toBe('TopicProductFeature');
    expect(result.reference.fields).toEqual(cdaEntry.fields);
  });
});
