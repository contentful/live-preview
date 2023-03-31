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
