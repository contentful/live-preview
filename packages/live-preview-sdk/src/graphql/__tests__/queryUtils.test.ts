import gql from 'graphql-tag';
import { describe, expect, it } from 'vitest';

import { parseGraphQLParams, updateAliasedInformation, isRelevantField } from '../queryUtils';

const query = gql`
  query Example {
    pageCollection(limit: 1) {
      __typename
      sys {
        id
      }
      name: internalName
      content {
        json
      }
      topSectionCollection {
        items {
          __typename
          sys {
            id
          }
        }
      }
    }
  }
`;

describe('parseGraphQLParams', () => {
  it('extracts the required information from the DocumentNode', () => {
    const result = parseGraphQLParams(query);

    expect(result).toEqual(
      new Map([
        ['Example', { alias: new Map(), fields: new Set(['pageCollection']) }],
        [
          'pageCollection',
          {
            alias: new Map([['internalName', 'name']]),
            fields: new Set([
              '__typename',
              'sys',
              'internalName',
              'content',
              'topSectionCollection',
            ]),
          },
        ],
        ['sys', { alias: new Map(), fields: new Set(['id']) }],
        ['content', { alias: new Map(), fields: new Set(['json']) }],
        ['topSectionCollection', { alias: new Map(), fields: new Set(['items']) }],
        ['TopSection', { alias: new Map(), fields: new Set(['sys', '__typename']) }],
      ])
    );
  });
});

describe('updateAliasedInformation', () => {
  const data = {
    sys: { id: '1' },
    internalName: 'Test',
    content: {},
    topSectionCollection: { items: [] },
  };
  const gqlParams = parseGraphQLParams(query);

  it('mirrors the value of the original name to the alias', () => {
    const result = updateAliasedInformation(data, 'pageCollection', gqlParams);

    expect(result).toEqual({
      ...data,
      name: data.internalName,
    });
  });
});

describe('isRelevantField', () => {
  it('returns true because no queryParams are provided', () => {
    expect(isRelevantField('content', 'pageCollection')).toBeTruthy();
  });

  it('validates the information based on the provided queryParams', () => {
    const gqlParams = parseGraphQLParams(query);

    // direct match => true
    expect(isRelevantField('content', 'pageCollection', gqlParams)).toBeTruthy();
    // collection match => true
    expect(isRelevantField('topSection', 'pageCollection', gqlParams)).toBeTruthy();
    // unknown alias => false
    expect(isRelevantField('internalName', 'pageCollection', gqlParams)).toBeTruthy();
    // unknown field => false
    expect(isRelevantField('header', 'pageCollection', gqlParams)).toBeFalsy();
  });
});
