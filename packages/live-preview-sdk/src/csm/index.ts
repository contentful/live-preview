import { vercelStegaEncode } from '@vercel/stega';
import jsonPointer from 'json-pointer';

import { debug } from '../helpers';
import { EntitySource, GraphQLResponse, Source } from './types';

const isUrlOrIsoDate = (value: string) => {
  // Regular expression for URL validation
  const urlRegex = /^(http|https):\/\/[^ "]+$/;
  // Regular expression for ISO 8601 date validation
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?([+-]\d{2}:\d{2}|Z)?$/;

  // Check if the string matches URL or ISO 8601 date format
  return urlRegex.test(value) || isoDateRegex.test(value);
};

const getHref = (
  source: Source,
  entries: EntitySource[],
  assets: EntitySource[],
  spaces: string[],
  environments: string[],
  fields: string[],
  locales: string[],
  targetOrigin?: 'https://app.contentful.com' | 'https://app.eu.contentful.com'
): string | null => {
  const isEntry = 'entry' in source;
  const entity = isEntry ? entries[source.entry] : assets[source.asset];
  if (!entity) return null;

  const space = spaces[entity.space];
  const environment = environments[entity.environment];
  const entityId = entity.id;
  const field = fields[source.field];
  const locale = locales[source.locale];
  const targetOriginUrl = targetOrigin || 'https://app.contentful.com';
  const basePath = `${targetOriginUrl}/spaces/${space}/environments/${environment}`;
  const entityType = isEntry ? 'entries' : 'assets';

  return `${basePath}/${entityType}/${entityId}/?focusedField=${field}&focusedLocale=${locale}`;
};

export const encodeSourceMap = (
  graphqlResponse: GraphQLResponse,
  targetOrigin?: 'https://app.contentful.com' | 'https://app.eu.contentful.com'
): GraphQLResponse => {
  if (
    !graphqlResponse ||
    !graphqlResponse.extensions ||
    !graphqlResponse.extensions.contentSourceMaps
  ) {
    debug.error('GraphQL response does not contain Content Source Maps information.');
    return graphqlResponse;
  }
  const { spaces, environments, fields, locales, entries, assets, mappings } =
    graphqlResponse.extensions.contentSourceMaps;
  const data = graphqlResponse.data;

  for (const pointer in mappings) {
    const { source } = mappings[pointer];
    const href = getHref(
      source,
      entries,
      assets,
      spaces,
      environments,
      fields,
      locales,
      targetOrigin
    );

    if (href && jsonPointer.has(data, pointer)) {
      const currentValue = jsonPointer.get(data, pointer);

      if (!isUrlOrIsoDate(currentValue)) {
        const encodedValue = vercelStegaEncode({
          origin: 'contentful.com',
          href,
        });
        jsonPointer.set(data, pointer, `${encodedValue}${currentValue}`);
      }
    } else {
      debug.error(`Pointer ${pointer} not found in GraphQL data or href could not be generated.`);
    }
  }
  return graphqlResponse;
};
