import jsonPointer from 'json-pointer';

import { clone } from './utils.js';
import { SourceMapMetadata, combine } from './encode.js';
import { encodeRichTextValue, isRichTextValue } from './richText.js';
import { GraphQLResponse } from './types.js';

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

export const encodeGraphQLResponse = (
  originalGraphqlResponse: GraphQLResponse,
  targetOrigin?: 'https://app.contentful.com' | 'https://app.eu.contentful.com',
): GraphQLResponse => {
  if (
    !originalGraphqlResponse ||
    !originalGraphqlResponse.extensions ||
    !originalGraphqlResponse.extensions.contentSourceMaps
  ) {
    console.error('GraphQL response does not contain Content Source Maps information.');
    return originalGraphqlResponse;
  }
  const modifiedGraphqlResponse = clone(
    originalGraphqlResponse as unknown as Record<string, unknown>,
  ) as unknown as GraphQLResponse;
  const { spaces, environments, fields, locales, entries, assets, mappings } =
    modifiedGraphqlResponse.extensions.contentSourceMaps;
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
          },
        };

        if (isRichTextValue(currentValue)) {
          encodeRichTextValue({ pointer, mappings, data, hiddenStrings });
        } else {
          const encodedValue = combine(currentValue, hiddenStrings);
          jsonPointer.set(data, pointer, encodedValue);
        }
      }
    } else {
      console.error(`Pointer ${pointer} not found in GraphQL data or href could not be generated.`);
    }
  }

  return modifiedGraphqlResponse;
};
