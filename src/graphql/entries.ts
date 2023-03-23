import { ContentTypeProps, EntryProps } from 'contentful-management/types';

import { isPrimitiveField, logUnrecognizedFields } from './utils';

/**
 * Updates GraphQL response data based on CMA entry object
 *
 * @param contentType entity
 * @param data the GraphQL response to be updated
 * @param update CMA entry object containing the update
 * @param locale code
 */
export function updateEntry(
  contentType: ContentTypeProps,
  data: Record<string, unknown>,
  update: EntryProps,
  locale: string
): Record<string, unknown> {
  const modified = { ...data };
  const { fields } = contentType;

  // Warn about unrecognized fields
  logUnrecognizedFields(
    fields.map((f) => f.apiName ?? f.name),
    data
  );

  for (const field of fields) {
    const name = field.apiName ?? field.name;

    if (isPrimitiveField(field) && name in data) {
      // Falling back to 'null' as it's what GraphQL users would expect
      // FIXME: handle locale fallbacks
      modified[name] = update.fields?.[name]?.[locale] ?? null;
    } else {
      const fieldItems = update.fields?.[name]?.[locale] as { sys: { id: string } }[];
      const modifiedCollectionItems = modified[`${name}Collection`] as {
        items: { sys: { id: string } }[];
      };

      if (fieldItems && modifiedCollectionItems) {
        const updatedRefs =
          fieldItems
            ?.map((item) => {
              const exists = modifiedCollectionItems.items.find(
                (collectionItem) => collectionItem.sys.id === item.sys.id
              );

              if (!exists) {
                // @TODO: When a new entry is added we don't know it's typename at this point. need to find workaround so this works
                return {
                  sys: { id: item.sys.id },
                  //__typename: '',
                };
              }

              return exists;
            })
            ?.filter(Boolean) ?? null;

        if (updatedRefs) {
          modifiedCollectionItems.items = updatedRefs;
        }
      }
    }
  }

  return modified;
}
