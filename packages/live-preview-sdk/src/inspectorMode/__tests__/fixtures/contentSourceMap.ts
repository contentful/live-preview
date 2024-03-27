import type { SourceMapMetadata } from '@contentful/content-source-maps';

export function createSourceMapFixture(
  entityId: string,
  overrides?: {
    origin?: string;
    contentful?: Partial<Omit<SourceMapMetadata['contentful'], 'entity'>>;
  },
): SourceMapMetadata {
  const origin = overrides?.origin ?? 'contentful.com';
  const space = overrides?.contentful?.space ?? 'master';
  const environment = overrides?.contentful?.environment ?? 'master';
  const entityType = overrides?.contentful?.entityType ?? 'Entry';
  const locale = overrides?.contentful?.locale ?? 'en-US';
  const field = overrides?.contentful?.field ?? 'title';
  const editorInterface = overrides?.contentful?.editorInterface ?? {
    widgetNamespace: 'builtin',
    widgetId: 'singleLine',
  };
  const fieldType = overrides?.contentful?.fieldType ?? 'Symbol';

  return {
    href: `https://app.${origin}/spaces/${space}/environments/${environment}/entries/${entityId}?focusedField=${field}&focusedLocale=${locale}`,
    origin,
    contentful: {
      space,
      environment,
      entity: entityId,
      entityType,
      field,
      locale,
      editorInterface,
      fieldType,
    },
  };
}
