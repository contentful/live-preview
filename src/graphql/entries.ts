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

  if (modified.sys.id !== update.sys.id) {
    return modified;
  }

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
    }
  }

  return modified;
}
