import { BLOCKS, INLINES } from '@contentful/rich-text-types';
import { Document } from '@contentful/rich-text-types';
import { Asset, AssetLink, Entry, EntryLink } from 'contentful';

import { ASSET_TYPENAME, CollectionItem, Entity } from '../types';

export function isEntityLink(value?: unknown): value is Entry | Asset {
  if (!value || typeof value !== 'object' || !('sys' in value)) {
    return false;
  }

  const sys = value.sys as AssetLink | EntryLink;

  return sys.type !== 'ResourceLink';
}

export function isResourceLink(value?: unknown): boolean {
  if (!value || typeof value !== 'object' || !('sys' in value)) {
    return false;
  }

  const sys = value.sys as AssetLink | EntryLink;

  return sys.type === 'ResourceLink';
}

export function isRichText(value?: unknown): value is Document {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Document;

  return obj.content && obj.nodeType === BLOCKS.DOCUMENT;
}

// TODO: Resouce Links are not supported yet, add it once we support it in live preview
export const SUPPORTED_RICHTEXT_EMBEDS = [
  BLOCKS.EMBEDDED_ENTRY,
  BLOCKS.EMBEDDED_ASSET,
  INLINES.EMBEDDED_ENTRY,
  INLINES.ENTRY_HYPERLINK,
  INLINES.ASSET_HYPERLINK,
];

export function isAsset(
  entity: Pick<Entry, 'sys'> | Pick<Asset, 'sys'> | (Entity & CollectionItem)
): boolean {
  return entity.sys && 'linkType' in entity.sys && entity.sys.linkType === ASSET_TYPENAME;
}
