import { EditorEntityStore, RequestedEntitiesMessage } from '@contentful/visual-sdk';
import type { Asset, Entry } from 'contentful';

import { generateTypeName } from '../graphql/utils';
import { ASSET_TYPENAME, EntityReferenceMap } from '../types';
import { sendMessageToEditor } from './utils';

const store: Record<string, EditorEntityStore> = {};

function getStore(locale: string): EditorEntityStore {
  if (!store[locale]) {
    store[locale] = new EditorEntityStore({
      entities: [],
      sendMessage: sendMessageToEditor,
      subscribe: (method, cb) => {
        // TODO: move this to a generic subscribe function on ContentfulLivePreview
        const listeners = (
          event: MessageEvent<RequestedEntitiesMessage & { from: 'live-preview'; method: string }>
        ) => {
          if (typeof event.data !== 'object' || !event.data) return;
          if (event.data.from !== 'live-preview') return;
          if (event.data.method === method) {
            cb(event.data);
          }
        };

        window.addEventListener('message', listeners);

        return () => window.removeEventListener('message', listeners);
      },
      locale,
    });
  }

  return store[locale];
}

export async function resolveReference(info: {
  entityReferenceMap: EntityReferenceMap;
  referenceId: string;
  locale: string;
}): Promise<{ reference: Entry; typeName: string }>;
export async function resolveReference(info: {
  entityReferenceMap: EntityReferenceMap;
  referenceId: string;
  isAsset: true;
  locale: string;
}): Promise<{ reference: Asset; typeName: string }>;
/**
 * Returns the requested reference from
 * 1) the entityReferenceMap if it was already resolved once
 * 2) loads it from the editor directly
 */
export async function resolveReference({
  entityReferenceMap,
  referenceId,
  isAsset,
  locale,
}: {
  entityReferenceMap: EntityReferenceMap;
  referenceId: string;
  isAsset?: boolean;
  locale: string;
}): Promise<{ reference: Entry | Asset; typeName: string }> {
  const reference = entityReferenceMap.get(referenceId);

  if (reference) {
    return {
      reference,
      typeName:
        'contentType' in reference.sys && reference.sys?.contentType?.sys?.id
          ? generateTypeName(reference.sys.contentType.sys.id)
          : ASSET_TYPENAME,
    };
  }

  if (isAsset) {
    const result = await getStore(locale).fetchAsset(referenceId);
    if (!result) {
      throw new Error(`Unknown reference ${referenceId}`);
    }

    return {
      reference: result,
      typeName: ASSET_TYPENAME,
    };
  }

  const result = await getStore(locale).fetchEntry(referenceId);
  if (!result) {
    throw new Error(`Unknown reference ${referenceId}`);
  }

  return {
    reference: result,
    typeName: generateTypeName(result.sys.contentType.sys.id),
  };
}
