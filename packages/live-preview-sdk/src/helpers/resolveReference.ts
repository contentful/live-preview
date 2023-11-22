import {
  EditorEntityStore,
  PostMessageMethods,
  RequestEntitiesMessage,
  RequestedEntitiesMessage,
} from '@contentful/visual-sdk';
import type { Asset, Entry } from 'contentful';

import { generateTypeName } from '../graphql/utils';
import { ASSET_TYPENAME, EntityReferenceMap } from '../types';

const store: Record<string, EditorEntityStore> = {};

export type SendMessage = (method: PostMessageMethods, params: RequestEntitiesMessage) => void;

function getStore(locale: string, sendMessage: SendMessage): EditorEntityStore {
  if (!store[locale]) {
    store[locale] = new EditorEntityStore({
      entities: [],
      sendMessage,
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
  sendMessage: SendMessage;
}): Promise<{ reference: Entry; typeName: string }>;
export async function resolveReference(info: {
  entityReferenceMap: EntityReferenceMap;
  referenceId: string;
  isAsset: true;
  locale: string;
  sendMessage: SendMessage;
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
  sendMessage,
}: {
  entityReferenceMap: EntityReferenceMap;
  referenceId: string;
  isAsset?: boolean;
  locale: string;
  sendMessage: SendMessage;
}): Promise<{ reference: Entry | Asset; typeName: string }> {
  // const reference = entityReferenceMap.get(referenceId);
  // FIXME maybe this will not be needed in future
  // @ts-expect-error -- .
  const reference = entityReferenceMap[referenceId];

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
    const result = await getStore(locale, sendMessage).fetchAsset(referenceId);
    if (!result) {
      throw new Error(`Unknown reference ${referenceId}`);
    }

    return {
      reference: result,
      typeName: ASSET_TYPENAME,
    };
  }

  const result = await getStore(locale, sendMessage).fetchEntry(referenceId);
  if (!result) {
    throw new Error(`Unknown reference ${referenceId}`);
  }

  return {
    reference: result,
    typeName: generateTypeName(result.sys.contentType.sys.id),
  };
}
