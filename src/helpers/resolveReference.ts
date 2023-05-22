import type { AssetProps, EntryProps } from 'contentful-management';

import { ASSET_TYPENAME, EntityReferenceMap, MessageFromEditor } from '../types';
import { sendMessageToEditor } from './utils';

type ReferencePromise = Promise<{
  reference: EntryProps | AssetProps;
  typeName: string;
}>;

const PromiseMap = new Map<string, ReferencePromise>();

function generateTypeName(contentTypeId: string): string {
  return contentTypeId.charAt(0).toUpperCase() + contentTypeId.slice(1);
}

function promiseCleanup(referenceId: string) {
  setTimeout(() => {
    PromiseMap.delete(referenceId);
  }, 300);
}

function loadReference(referenceId: string, isAsset?: boolean): ReferencePromise {
  const openPromise = PromiseMap.get(referenceId);

  if (openPromise) {
    return openPromise;
  }

  const newPromise = new Promise<Awaited<ReferencePromise>>((resolve) => {
    const fn = (event: MessageEvent<MessageFromEditor>) => {
      if (typeof event.data !== 'object' || !event.data) return;
      if (event.data.from !== 'live-preview') return;

      // Check if the correct event is received and it contains the correct data (there could be multiple unknown references)
      if (
        event.data.action === 'UNKNOWN_REFERENCE_LOADED' &&
        event.data.reference.sys.id === referenceId
      ) {
        resolve({
          reference: event.data.reference,
          typeName: event.data.contentType
            ? generateTypeName(event.data.contentType.sys.id)
            : ASSET_TYPENAME,
        });
        promiseCleanup(referenceId);
        window.removeEventListener('message', fn);
      }
    };

    window.addEventListener('message', fn);

    sendMessageToEditor({
      action: 'ENTITY_NOT_KNOWN',
      referenceEntityId: referenceId,
      referenceContentType: isAsset ? ASSET_TYPENAME : undefined,
    });
  });

  PromiseMap.set(referenceId, newPromise);

  return newPromise;
}

export async function resolveReference(info: {
  entityReferenceMap: EntityReferenceMap;
  referenceId: string;
  isAsset?: false;
}): Promise<{ reference: EntryProps; typeName: string }>;
export async function resolveReference(info: {
  entityReferenceMap: EntityReferenceMap;
  referenceId: string;
  isAsset: true;
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
}: {
  entityReferenceMap: EntityReferenceMap;
  referenceId: string;
  isAsset?: boolean;
}): Promise<{ reference: EntryProps | AssetProps; typeName: string }> {
  const reference = entityReferenceMap.get(referenceId);

  if (!reference) {
    const result = await loadReference(referenceId, isAsset);

    return {
      reference: result.reference,
      typeName: result.typeName,
    };
  }

  return {
    reference,
    typeName: reference.sys.contentType?.sys?.id
      ? generateTypeName(reference.sys.contentType.sys.id)
      : ASSET_TYPENAME,
  };
}
