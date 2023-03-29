import type { ContentFields } from 'contentful-management/types';

import { Entity } from '../types';

const DEFAULT_CONTENT_TYPE_FIELDS = ['sys', '__typename', 'contentfulMetadata'];
const PRIMITIVE_FIELDS = new Set([
  'Symbol',
  'Text',
  'Integer',
  'Boolean',
  'Date',
  'Location',
  'Object',
]);

export function logUnrecognizedFields(contentTypeFields: string[], data: Entity): void {
  const recognized = new Set([...DEFAULT_CONTENT_TYPE_FIELDS, ...contentTypeFields]);

  for (const field of Object.keys(data)) {
    if (!recognized.has(field)) {
      console.warn(`Unrecognized field '${field}'. Note that GraphQL aliases are not supported`);
    }
  }
}

export function isPrimitiveField(field: ContentFields): boolean {
  if (PRIMITIVE_FIELDS.has(field.type)) {
    return true;
  }

  // Array of Symbols
  if (field.type === 'Array' && field.items?.type === 'Symbol') {
    return true;
  }

  return false;
}
