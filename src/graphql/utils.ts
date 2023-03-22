import { ContentFields } from 'contentful-management/types';

export function logUnrecognizedFields(
  contentTypeFields: string[],
  data: Record<string, unknown>
): void {
  const recognized = new Set(['sys', '__typename', 'contentfulMetadata', ...contentTypeFields]);

  for (const field of Object.keys(data)) {
    if (!recognized.has(field)) {
      console.warn(`Unrecognized field '${field}'. Note that GraphQL aliases are not supported`);
    }
  }
}

export function isPrimitiveField(field: ContentFields): boolean {
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

export function isComplexField(field: ContentFields): boolean {
  const types = new Set(['Link', 'ResourceLink']);

  if (types.has(field.type)) {
    return true;
  }

  // Array of Links or ResourceLinks
  if (
    (field.type === 'Array' && field.items?.type === 'Link') ||
    (field.type === 'Array' && field.items?.type === 'ResourceLink')
  ) {
    return true;
  }

  return false;
}
