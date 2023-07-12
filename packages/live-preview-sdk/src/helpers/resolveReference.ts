import { EditorEntityStore, RequestedEntitiesMessage } from '@contentful/visual-sdk';
import type { Asset, Entry } from 'contentful';
import type { AssetProps, EntryProps } from 'contentful-management';

import { ASSET_TYPENAME, EntityReferenceMap } from '../types';
import { clone, sendMessageToEditor } from './utils';

import { ContentfulLivePreview } from '..';

let store: EditorEntityStore | undefined = undefined;

export function generateTypeName(contentTypeId: string): string {
  return contentTypeId.charAt(0).toUpperCase() + contentTypeId.slice(1);
}

function getStore() {
  if (!store) {
    store = new EditorEntityStore({
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
      locale: ContentfulLivePreview.locale,
    });
  }

  return store;
}

function fallback(asset: Asset, locale: string): AssetProps;
function fallback(entry: Entry, locale: string): EntryProps;
function fallback(entity: Asset | Entry, locale: string): AssetProps | EntryProps {
  const cloned = clone(entity as any);

  for (const key in cloned.fields) {
    cloned.fields[key] = { [locale]: cloned.fields[key] };
  }

  return cloned;
}

export async function resolveReference(info: {
  entityReferenceMap: EntityReferenceMap;
  referenceId: string;
  locale: string;
}): Promise<{ reference: EntryProps; typeName: string }>;
export async function resolveReference(info: {
  entityReferenceMap: EntityReferenceMap;
  referenceId: string;
  isAsset: true;
  locale: string;
}): Promise<{ reference: AssetProps; typeName: string }>;
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
}): Promise<{ reference: EntryProps | AssetProps; typeName: string }> {
  const reference = entityReferenceMap.get(referenceId);

  if (reference) {
    return {
      reference,
      typeName: reference.sys.contentType?.sys?.id
        ? generateTypeName(reference.sys.contentType.sys.id)
        : ASSET_TYPENAME,
    };
  }

  if (isAsset) {
    const result = await getStore().fetchAsset(referenceId);
    if (!result) {
      throw new Error(`Unknown reference ${referenceId}`);
    }

    return {
      reference: fallback(result, locale),
      typeName: ASSET_TYPENAME,
    };
  }

  const result = await getStore().fetchEntry(referenceId);
  if (!result) {
    throw new Error(`Unknown reference ${referenceId}`);
  }

  return {
    reference: fallback(result, locale),
    typeName: generateTypeName(result.sys.contentType.sys.id),
  };
}
