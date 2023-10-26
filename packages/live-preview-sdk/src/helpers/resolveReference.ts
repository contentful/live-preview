import type { Asset, Entry } from 'contentful';

import { generateTypeName } from '../graphql/utils';
import { ASSET_TYPENAME, GetStore } from '../types';

export async function resolveReference(info: {
  referenceId: string;
  locale: string;
  getStore: GetStore;
}): Promise<{ reference: Entry; typeName: string }>;
export async function resolveReference(info: {
  referenceId: string;
  isAsset: true;
  locale: string;
  getStore: GetStore;
}): Promise<{ reference: Asset; typeName: string }>;
/**
 * Returns the requested reference from
 * 1) the store if it was already resolved once
 * 2) loads it from the editor directly
 */
export async function resolveReference({
  referenceId,
  isAsset,
  locale,
  getStore,
}: {
  referenceId: string;
  isAsset?: boolean;
  locale: string;
  getStore: GetStore;
}): Promise<{ reference: Entry | Asset; typeName: string }> {
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
