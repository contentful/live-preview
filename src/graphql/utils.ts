import { Entity } from '../types';

const DEFAULT_CONTENT_TYPE_FIELDS = ['sys', '__typename', 'contentfulMetadata'];

export function logUnrecognizedFields(contentTypeFields: string[], data: Entity): void {
  const recognized = new Set([...DEFAULT_CONTENT_TYPE_FIELDS, ...contentTypeFields]);

  for (const field of Object.keys(data)) {
    if (!recognized.has(field)) {
      console.warn(`Unrecognized field '${field}'. Note that GraphQL aliases are not supported`);
    }
  }
}
