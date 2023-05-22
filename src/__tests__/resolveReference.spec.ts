/* @vitest-environment jsdom */
import type { AssetProps, EntryProps } from 'contentful-management';
import { beforeEach, describe, vi, it, afterEach, expect } from 'vitest';

import { sendMessageToEditor } from '../helpers';
import { resolveReference } from '../helpers/resolveReference';
import { ASSET_TYPENAME } from '../types';

vi.mock('../helpers/utils');

describe('resolveReference', () => {
  const listener = vi.spyOn(window, 'addEventListener');

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('asset', () => {
    const asset = {
      fields: {
        file: { 'en-US': { fileName: 'abc.jpg' } },
      },
      sys: {
        id: '1',
      },
    } as unknown as AssetProps;

    const expected = {
      reference: {
        fields: {
          file: {
            'en-US': {
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
      });

      expect(result).toEqual(expected);
    });

    it('resolves it from the editor', async () => {
      const prom = resolveReference({
        entityReferenceMap: new Map(),
        referenceId: '1',
        isAsset: true,
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(sendMessageToEditor).toHaveBeenCalledTimes(1);
      expect(sendMessageToEditor).toHaveBeenCalledWith({
        action: 'ENTITY_NOT_KNOWN',
        referenceEntityId: '1',
        referenceContentType: ASSET_TYPENAME,
      });

      (listener.mock.calls[0][1] as EventListener)({
        data: {
          from: 'live-preview',
          action: 'UNKNOWN_REFERENCE_LOADED',
          reference: asset,
        },
      } as MessageEvent);

      const result = await prom;

      expect(result).toEqual(expected);
    });

    it('ignores different entries while waiting for the reference', async () => {
      const prom = resolveReference({
        entityReferenceMap: new Map(),
        referenceId: '1',
        isAsset: true,
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(sendMessageToEditor).toHaveBeenCalledTimes(1);
      expect(sendMessageToEditor).toHaveBeenCalledWith({
        action: 'ENTITY_NOT_KNOWN',
        referenceEntityId: '1',
        referenceContentType: ASSET_TYPENAME,
      });

      (listener.mock.calls[0][1] as EventListener)({
        data: {
          from: 'live-preview',
          action: 'UNKNOWN_REFERENCE_LOADED',
          reference: { sys: { id: '2' } },
        },
      } as MessageEvent);

      (listener.mock.calls[0][1] as EventListener)({
        data: {
          from: 'live-preview',
          action: 'INSPECTOR_MODE_CHANGED',
          isInspectorActive: false,
        },
      } as MessageEvent);

      (listener.mock.calls[0][1] as EventListener)({
        data: {
          from: 'live-preview',
          action: 'UNKNOWN_REFERENCE_LOADED',
          reference: asset,
        },
      } as MessageEvent);

      const result = await prom;

      expect(result).toEqual(expected);
    });

    it('dedupes requests', async () => {
      const prom = resolveReference({
        entityReferenceMap: new Map(),
        referenceId: '1',
        isAsset: true,
      });

      const prom2 = resolveReference({
        entityReferenceMap: new Map(),
        referenceId: '1',
        isAsset: true,
      });

      (listener.mock.calls[0][1] as EventListener)({
        data: {
          from: 'live-preview',
          action: 'UNKNOWN_REFERENCE_LOADED',
          reference: asset,
        },
      } as MessageEvent);

      const result = await prom;
      const result2 = await prom2;

      expect(result).toEqual(expected);
      expect(result2).toEqual(expected);
      expect(listener).toHaveBeenCalledTimes(1);
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
      });

      expect(result).toEqual(expected);
    });

    it('resolves it from the editor', async () => {
      const prom = resolveReference({
        entityReferenceMap: new Map(),
        referenceId: '1',
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(sendMessageToEditor).toHaveBeenCalledTimes(1);
      expect(sendMessageToEditor).toHaveBeenCalledWith({
        action: 'ENTITY_NOT_KNOWN',
        referenceEntityId: '1',
      });

      (listener.mock.calls[0][1] as EventListener)({
        data: {
          from: 'live-preview',
          action: 'UNKNOWN_REFERENCE_LOADED',
          reference: entry,
          contentType: entry.sys.contentType,
        },
      } as MessageEvent);

      const result = await prom;

      expect(result).toEqual(expected);
    });
  });
});
