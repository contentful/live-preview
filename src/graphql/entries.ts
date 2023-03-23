import { ContentTypeProps, EntryProps, AssetProps } from 'contentful-management/types';

import { CollectionItem, SysProps } from '../types';
import { isPrimitiveField, logUnrecognizedFields } from './utils';

/**
 * Updates GraphQL response data based on CMA entry object
 *
 * @param contentType ContentTypeProps
 * @param data Record<string, unknown> - The GraphQL response to be updated
 * @param update EntryProps - CMA entry object containing the update
 * @param locale string - Locale code
 * @returns Record<string, unknown> - Updated GraphQL response data
 */
export function updateEntry(
  contentType: ContentTypeProps,
  data: Record<string, unknown> & { sys: SysProps },
  update: EntryProps,
  locale: string,
  references: any
): Record<string, unknown> & { sys: SysProps } {
  const modified = { ...data };
  const { fields } = contentType;

  logUnrecognizedFields(
    fields.map((f) => f.apiName ?? f.name),
    data
  );

  if (modified.sys.id !== update.sys.id) {
    return modified;
  }

  for (const field of fields) {
    const name = field.apiName ?? field.name;

    if (isPrimitiveField(field)) {
      updatePrimitiveField(modified, update, name, locale);
    } else if (field.type === 'RichText') {
      updateRichTextField(modified, update, name, locale);
    } else if (field.type === 'Array' && field.items?.type === 'Link') {
      updateMultiRefField(modified, update, name, locale, references);
    }
  }

  return modified;
}

function updatePrimitiveField(
  modified: Record<string, unknown>,
  update: EntryProps,
  name: string,
  locale: string
) {
  if (name in modified) {
    modified[name] = update.fields?.[name]?.[locale] ?? null;
  }
}

function updateRichTextField(
  modified: Record<string, unknown>,
  update: EntryProps,
  name: string,
  locale: string
) {
  if (name in modified) {
    (modified[name] as { json: unknown }).json = update?.fields?.[name]?.[locale] ?? null;
  }
}

function getContentTypeOfEntityFromReferences(references: any, entityId?: string) {
  if (references && entityId) {
    const assetInfo = references.includes.Asset.find(
      (asset: AssetProps) => asset.sys.id === entityId
    );
    const entryInfo = references.includes.Entry.find(
      (entry: EntryProps) => entry.sys.id === entityId
    );
    const contentTypeId = entryInfo
      ? entryInfo.sys.contentType.sys.id
      : assetInfo
      ? assetInfo.sys.contentType.sys.id
      : undefined;

    if (contentTypeId) {
      return contentTypeId.charAt(0).toUpperCase() + contentTypeId.slice(1);
    }
  }
}

function updateMultiRefField(
  modified: Record<string, unknown>,
  update: EntryProps,
  name: string,
  locale: string,
  references: any
) {
  const fieldName = `${name}Collection`;

  if (fieldName in modified) {
    const originalCollection = modified[fieldName] as { items: CollectionItem[] };
    const modifiedItems = update?.fields?.[name]?.[locale].map((modifiedItem: any) => {
      const currentItem = originalCollection.items.find(
        (item) => item.sys.id === modifiedItem.sys.id
      );

      if (currentItem && currentItem.__typename) {
        return currentItem;
      }

      const modifiedRef = { ...modifiedItem };

      const contentTypeId = getContentTypeOfEntityFromReferences(references, currentItem?.sys?.id);
      if (contentTypeId) {
        const typename = contentTypeId.charAt(0).toUpperCase() + contentTypeId.slice(1);
        modifiedRef.__typename = typename;
      }
      return modifiedRef;
    });
    (modified[fieldName] as { items: CollectionItem[] }).items = modifiedItems;
  }
}
