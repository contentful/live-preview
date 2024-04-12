import { has, get } from 'json-pointer';
import type { GraphQLResponse } from '../types.js';
import {
  clone,
  createSourceMapMetadata,
  encodeField,
  isBuiltinNamespace,
  isSupportedWidget,
} from '../utils.js';

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
  const target = modifiedGraphqlResponse.data;

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

    if (has(target, pointer)) {
      const currentValue = get(target, pointer);

      if (currentValue !== null) {
        const hiddenStrings = createSourceMapMetadata({
          entityId,
          entityType,
          space,
          environment,
          field,
          locale,
          editorInterface,
          fieldType,
          targetOrigin,
        });

        encodeField(fieldType, currentValue, hiddenStrings, target, pointer, mappings);
      }
    } else {
      console.error(`Pointer ${pointer} not found in GraphQL data or href could not be generated.`);
    }
  }
  return modifiedGraphqlResponse;
};
