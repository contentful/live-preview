import { get, has } from 'json-pointer';

import type { CreateSourceMapParams } from '../types.js';
import {
  clone,
  createSourceMapMetadata,
  encodeField,
  isBuiltinNamespace,
  isSupportedWidget,
} from '../utils.js';

export const encodeGraphQLResponse = <TResponse extends { data: any; extensions: any }>(
  originalGraphqlResponse: TResponse,
  targetOrigin?: CreateSourceMapParams['targetOrigin'],
  platform?: CreateSourceMapParams['platform'],
): TResponse => {
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
  const modifiedGraphqlResponse = clone(originalGraphqlResponse);
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
  const target = modifiedGraphqlResponse;

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
          platform,
        });

        encodeField(fieldType, currentValue, hiddenStrings, target, pointer, mappings);
      }
    } else {
      //@TODO - add Sentry logging
      // console.warn(`Pointer ${pointer} not found in the entry`, target);
    }
  }
  return modifiedGraphqlResponse;
};
