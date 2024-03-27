import jsonPointer from 'json-pointer';

import { SourceMapMetadata, combine } from './encode.js';
import { encodeRichTextValue } from './richText.js';
import { GraphQLResponse, WidgetId, WidgetNamespace } from './types.js';
import { SUPPORTED_WIDGETS, clone } from './utils.js';

export const getHref = (
  entityId: string,
  entityType: string,
  space: string,
  environment: string,
  field: string,
  locale: string,
  targetOrigin?: 'https://app.contentful.com' | 'https://app.eu.contentful.com',
): string => {
  const targetOriginUrl = targetOrigin || 'https://app.contentful.com';
  const basePath = `${targetOriginUrl}/spaces/${space}/environments/${environment}`;
  const entityRoute = entityType === 'Entry' ? 'entries' : 'assets';

  return `${basePath}/${entityRoute}/${entityId}/?focusedField=${field}&focusedLocale=${locale}`;
};

const isBuiltinNamespace = (namespace: WidgetNamespace) =>
  ['builtin', 'sidebar-builtin', 'editor-builtin'].includes(namespace);
const isSupportedWidget = (widgetId: WidgetId) => SUPPORTED_WIDGETS.includes(widgetId);

export const encodeGraphQLResponse = (
  originalGraphqlResponse: GraphQLResponse,
  targetOrigin?: 'https://app.contentful.com' | 'https://app.eu.contentful.com',
): GraphQLResponse => {
  if (
    !originalGraphqlResponse ||
    !originalGraphqlResponse.extensions ||
    !originalGraphqlResponse.extensions.contentSourceMaps
  ) {
    console.error(
      'GraphQL response does not contain Content Source Maps information.',
      originalGraphqlResponse,
    );
    return originalGraphqlResponse;
  }
  const modifiedGraphqlResponse = clone(
    originalGraphqlResponse as unknown as Record<string, unknown>,
  ) as unknown as GraphQLResponse;
  const {
    spaces,
    environments,
    editorInterfaces,
    fields,
    locales,
    entries,
    assets,
    mappings,
    fieldTypes,
  } = modifiedGraphqlResponse.extensions.contentSourceMaps;
  const data = modifiedGraphqlResponse.data;

  for (const pointer in mappings) {
    const { source } = mappings[pointer];

    const entity = 'entry' in source ? entries[source.entry] : assets[source.asset];
    const entityType = 'entry' in source ? 'Entry' : 'Asset';

    if (!entity) {
      return modifiedGraphqlResponse;
    }

    const space = spaces[entity.space];
    const environment = environments[entity.environment];
    const entityId = entity.id;
    const field = fields[source.field];
    const locale = locales[source.locale];
    const editorInterface = editorInterfaces[source.editorInterface];
    const fieldType = fieldTypes[source.fieldType];

    // Skip unsupported widgets
    if (
      isBuiltinNamespace(editorInterface.widgetNamespace) &&
      !isSupportedWidget(editorInterface.widgetId)
    ) {
      continue;
    }

    const href = getHref(entityId, entityType, space, environment, field, locale, targetOrigin);

    if (jsonPointer.has(data, pointer)) {
      const currentValue = jsonPointer.get(data, pointer);

      if (currentValue !== null) {
        const hiddenStrings: SourceMapMetadata = {
          origin: 'contentful.com',
          href,
          contentful: {
            space,
            environment,
            field,
            locale,
            entity: entityId,
            entityType,
            editorInterface,
            fieldType,
          },
        };
        // Symbol
        if (fieldType === 'Symbol') {
          const encodedValue = combine(currentValue, hiddenStrings);
          jsonPointer.set(data, pointer, encodedValue);
        }

        // RichText
        if (fieldType === 'RichText') {
          encodeRichTextValue({ pointer, mappings, data, hiddenStrings });
        }

        // Array of Symbols
        if (fieldType === 'Array') {
          const encodedArray = currentValue.map((item: unknown) => {
            if (typeof item === 'string') {
              return combine(item, hiddenStrings);
            } else {
              return item; // Return the item unchanged if it's not a string
            }
          });
          jsonPointer.set(data, pointer, encodedArray);
        }
      }
    } else {
      console.error(`Pointer ${pointer} not found in GraphQL data or href could not be generated.`);
    }
  }

  return modifiedGraphqlResponse;
};
