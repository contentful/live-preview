const COLLECTION_SUFFIX = 'Collection';

/** Generates the name of the field for a collection */
export function buildCollectionName(name: string): string {
  return `${name}${COLLECTION_SUFFIX}`;
}
