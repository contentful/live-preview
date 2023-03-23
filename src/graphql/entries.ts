import { ContentTypeProps, EntryProps } from 'contentful-management/types';

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
  locale: string
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
      updateMultiRefField(modified, update, name, locale);
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

function updateMultiRefField(
  modified: Record<string, unknown>,
  update: EntryProps,
  name: string,
  locale: string
) {
  if (name in modified) {
    // Listen to sorting
    (modified[`${name}Collection`] as { items: CollectionItem[] }).items.sort((a, b) => {
      const aIndex = update?.fields?.[name]?.[locale].findIndex(
        (item: CollectionItem) => item.sys.id === a.sys.id
      );
      const bIndex = update?.fields?.[name]?.[locale].findIndex(
        (item: CollectionItem) => item.sys.id === b.sys.id
      );
      return aIndex - bIndex;
    });

    // Listen to removal
    const updateRefIds = update?.fields?.[name]?.[locale].map(
      (item: CollectionItem) => item.sys.id
    );
    (modified[`${name}Collection`] as { items: CollectionItem[] }).items = (
      modified[`${name}Collection`] as { items: CollectionItem[] }
    ).items.filter((item: CollectionItem) => updateRefIds.includes(item.sys.id));
  }
}
