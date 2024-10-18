import type { SourceMapMetadata } from '@contentful/content-source-maps';

type ContentfulMetadata = Exclude<SourceMapMetadata['contentful'], undefined>;

export function createSourceMapFixture(
  entityId: string,
  overrides?: {
    origin?: string;
    entityType?: 'Entry' | 'Asset';
    contentful?: Partial<Omit<ContentfulMetadata, 'entity'>>;
  },
): SourceMapMetadata {
  const origin = overrides?.origin ?? 'contentful.com';
  const space = 'master';
  const environment = 'master';
  const entityType = overrides?.entityType ?? 'Entry';
  const entityTypeUrl = entityType === 'Entry' ? 'entries' : 'assets';
  const locale = 'en-US';
  const field = 'title';
  const editorInterface = overrides?.contentful?.editorInterface ?? {
    widgetNamespace: 'builtin',
    widgetId: 'singleLine',
  };
  const fieldType = overrides?.contentful?.fieldType ?? 'Symbol';

  return {
    href: `https://app.${origin}/spaces/${space}/environments/${environment}/${entityTypeUrl}/${entityId}?focusedField=${field}&focusedLocale=${locale}`,
    origin,
    contentful: {
      editorInterface,
      fieldType,
    },
  };
}
