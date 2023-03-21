import { ContentTypeProps, ContentFields, EntryProps } from 'contentful-management/types';

function logUnrecognizedFields(contentTypeFields: string[], data: Record<string, unknown>) {
  const recognized = new Set(['sys', '__typename', 'contentfulMetadata', ...contentTypeFields]);

  for (const field of Object.keys(data)) {
    if (!recognized.has(field)) {
      console.warn(`Unrecognized field '${field}'. Note that GraphQL aliases are not supported`);
    }
  }
}

function isPrimitiveField(field: ContentFields) {
  const types = new Set(['Symbol', 'Text', 'Integer', 'Boolean', 'Date', 'Location', 'Object']);

  if (types.has(field.type)) {
    return true;
  }

  // Array of Symbols
  if (field.type === 'Array' && field.items?.type === 'Symbol') {
    return true;
  }

  return false;
}

/**
 * Updates GraphQL response data based on CMA entry object
 *
 * @param contentType entity
 * @param data the GraphQL response to be updated
 * @param update CMA entry object containing the update
 * @param locale locale code
 */
export function updateGQLEntry(
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
    }
  }

  return modified;
}
