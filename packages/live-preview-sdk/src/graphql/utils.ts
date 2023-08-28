const COLLECTION_SUFFIX = 'Collection';

export function generateTypeName(contentTypeId: string): string {
  return contentTypeId.charAt(0).toUpperCase() + contentTypeId.slice(1);
}

/** Generates the name of the field for a collection */
export function buildCollectionName(name: string): string {
  return `${name}${COLLECTION_SUFFIX}`;
}

/**
 * Extract the name of an entry from the collection (e.g. "postCollection" => "Post")
 * Returns undefined if the name doesn't has the collection suffix.
 */
export function extractNameFromCollectionName(collection: string): string | undefined {
  if (!collection.endsWith(COLLECTION_SUFFIX)) {
    return undefined;
  }

  return generateTypeName(collection.replace(COLLECTION_SUFFIX, ''));
}
