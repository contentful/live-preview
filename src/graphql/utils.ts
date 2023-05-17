import { debug } from '../helpers';
import { Entity } from '../types';

const DEFAULT_CONTENT_TYPE_FIELDS = ['sys', '__typename', 'contentfulMetadata'];

export function logUnrecognizedFields(contentTypeFields: string[], data: Entity): void {
  const recognized = new Set([...DEFAULT_CONTENT_TYPE_FIELDS, ...contentTypeFields]);

  for (const field of Object.keys(data)) {
    if (!(recognized.has(field) || recognized.has(removeCollection(field)))) {
      debug.warn(`Unrecognized field '${field}'. Note that GraphQL aliases are not supported`);
    }
  }
}

const COLLECTION_SUFFIX = 'Collection';

export function buildCollectionName(name: string): string {
  return `${name}${COLLECTION_SUFFIX}`;
}

function removeCollection(name: string): string {
  return name.replace(COLLECTION_SUFFIX, '');
}
