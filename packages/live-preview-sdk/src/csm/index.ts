import { vercelStegaEncode } from '@vercel/stega';
import { debug } from '../helpers';
import jsonPointer from 'json-pointer';
import { EntitySource, GraphQLResponse, Source } from './types';

export class ContentSourceMaps {
  private isUrlOrIsoDate(value: string) {
    // Regular expression for URL validation
    const urlRegex = /^(http|https):\/\/[^ "]+$/;
    // Regular expression for ISO 8601 date validation
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?([+-]\d{2}:\d{2}|Z)?$/;

    // Check if the string matches URL or ISO 8601 date format
    return urlRegex.test(value) || isoDateRegex.test(value);
  }

  private getHref(
    source: Source,
    entries: EntitySource[],
    assets: EntitySource[],
    spaces: string[],
    environments: string[],
    fields: string[],
    locales: string[]
  ): string | null {
    const isEntry = 'entry' in source;
    const entity = isEntry ? entries[source.entry] : assets[source.asset];
    if (!entity) return null;

    const space = spaces[entity.space];
    const environment = environments[entity.environment];
    const entityId = entity.id;
    const field = fields[source.field];
    const locale = locales[source.locale];

    const basePath = `https://app.contentful.com/spaces/${space}/environments/${environment}`;
    const entityType = isEntry ? 'entries' : 'assets';
    return `${basePath}/${entityType}/${entityId}/?focusedField=${field}&focusedLocale=${locale}`;
  }

  encodeSourceMap(graphqlResponse: GraphQLResponse): GraphQLResponse {
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
      const href = this.getHref(source, entries, assets, spaces, environments, fields, locales);

      if (href && jsonPointer.has(data, pointer)) {
        const currentValue = jsonPointer.get(data, pointer);

        if (!this.isUrlOrIsoDate(currentValue)) {
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
  }
}
