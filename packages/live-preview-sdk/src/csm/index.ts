import jsonPointer from 'json-pointer';

import { debug } from '../helpers';
import { encode } from './encode';
import { GraphQLResponse } from './types';

const isUrlOrIsoDate = (value: string) => {
  // Regular expression for URL validation
  const urlRegex = /^(http|https):\/\/[^ "]+$/;
  // Regular expression for ISO 8601 date validation
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?([+-]\d{2}:\d{2}|Z)?$/;

  // Check if the string matches URL or ISO 8601 date format
  return urlRegex.test(value) || isoDateRegex.test(value);
};

const getHref = (
  entityId: string,
  entityType: 'Entry' | 'Asset',
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

const findRichTextNodes = (data: any, currentPath = '/'): string[] => {
  const textNodes = [];
  const node = jsonPointer.get(data, currentPath);

  if (node.content) {
    for (let i = 0; i < node.content.length; i++) {
      if (node.content[i].nodeType === 'text') {
        textNodes.push(`${currentPath}/content/${i}/value`);
      } else {
        textNodes.push(...findRichTextNodes(data, `${currentPath}/content/${i}`));
      }
    }
  }

  return textNodes;
};

export const encodeSourceMap = (
  graphqlResponse: GraphQLResponse,
  targetOrigin?: 'https://app.contentful.com' | 'https://app.eu.contentful.com',
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

    const entity = 'entry' in source ? entries[source.entry] : assets[source.asset];
    const entityType = 'entry' in source ? 'Entry' : 'Asset';

    if (!entity) {
      return graphqlResponse;
    }

    const space = spaces[entity.space];
    const environment = environments[entity.environment];
    const entityId = entity.id;
    const field = fields[source.field];
    const locale = locales[source.locale];

    const href = getHref(entityId, entityType, space, environment, field, locale, targetOrigin);

    if (jsonPointer.has(data, pointer)) {
      const currentValue = jsonPointer.get(data, pointer);

      if (!isUrlOrIsoDate(currentValue)) {
        const encodedValue = encode({
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
        });

        // if we have a rich object then we add encoding to all text nodes
        if (typeof currentValue === 'object' && currentValue.nodeType) {
          // we are a rich text
          // - remove original mapping
          const source = mappings[pointer];
          delete mappings[pointer];

          // - add mapping to all text nodes
          const textNodes = findRichTextNodes(data, pointer);

          for (const textNode of textNodes) {
            mappings[textNode] = source;
            const currentTextNodeValue = jsonPointer.get(data, textNode);
            jsonPointer.set(data, textNode, `${encodedValue}${currentTextNodeValue}`);
          }
        } else {
          jsonPointer.set(data, pointer, `${encodedValue}${currentValue}`);
        }
      }
    } else {
      debug.error(`Pointer ${pointer} not found in GraphQL data or href could not be generated.`);
    }
  }

  return graphqlResponse;
};
