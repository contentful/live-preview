import {
  EditorEntityStore,
  PostMessageMethods,
  RequestEntitiesMessage,
  RequestedEntitiesMessage,
} from '@contentful/visual-sdk';
import type { Asset, Entry } from 'contentful';

import { generateTypeName } from '../graphql/utils';
import { ASSET_TYPENAME, ReferenceMap } from '../types';

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
  referenceId: string;
  locale: string;
  sendMessage: SendMessage;
  referenceMap: ReferenceMap;
}): Promise<{ reference: Entry; typeName: string }>;
export async function resolveReference(info: {
  referenceId: string;
  isAsset: true;
  locale: string;
  sendMessage: SendMessage;
  referenceMap: ReferenceMap;
}): Promise<{ reference: Asset; typeName: string }>;
/**
 * Returns the requested reference from
 * 1) the referenceMap if it was already resolved once
 * 2) loads it from the editor directly
 */
export async function resolveReference({
  referenceId,
  isAsset,
  locale,
  sendMessage,
  referenceMap,
}: {
  referenceId: string;
  isAsset?: boolean;
  locale: string;
  sendMessage: SendMessage;
  referenceMap: ReferenceMap;
}): Promise<{ reference: Entry | Asset; typeName: string }> {
  const reference = referenceMap.get(referenceId);
  if (reference) {
    referenceMap.set(referenceId, reference);
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

  referenceMap.set(referenceId, result);
  return {
    reference: result,
    typeName: generateTypeName(result.sys.contentType.sys.id),
  };
}
