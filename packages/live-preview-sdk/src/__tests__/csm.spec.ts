import { vercelStegaDecode } from '@vercel/stega';
import jsonPointer from 'json-pointer';
import { describe, test, expect } from 'vitest';

import { encodeSourceMap } from '../csm';
import type { SourceMapMetadata } from '../csm/encode';

type Mappings = Record<string, SourceMapMetadata | Record<string, SourceMapMetadata> | undefined>;

type EncodedResponse =
  | {
      [key: string]: string;
    }
  | Array<{ [key: string]: string }>;

function testEncodingDecoding(encodedResponse: EncodedResponse, mappings: Mappings) {
  if (Array.isArray(encodedResponse)) {
    encodedResponse.forEach((item, index) => {
      const itemMappings = mappings[index];
      if (!itemMappings) {
        return;
      }
      for (const [key, expectedValue] of Object.entries(itemMappings)) {
        const encodedValue = jsonPointer.get(item, key);
        const decodedValue = vercelStegaDecode(encodedValue);
        expect(decodedValue).toEqual(expectedValue);
      }
    });
  } else {
    for (const [key, expectedValue] of Object.entries(mappings)) {
      const encodedValue = jsonPointer.get(encodedResponse, key);
      const decodedValue = vercelStegaDecode(encodedValue);
      expect(decodedValue).toEqual(expectedValue);
    }
  }
}

describe('Content Source Maps', () => {
  describe('GraphQL', () => {
    test('basic example', () => {
      const graphQLResponse = {
        data: {
          post: {
            title: 'Title of the post',
            subtitle: 'Subtitle of the post',
          },
        },
        extensions: {
          contentSourceMaps: {
            version: 1.0,
            spaces: ['foo'],
            environments: ['master'],
            fields: ['title', 'subtitle'],
            locales: ['en-US'],
            entries: [{ space: 0, environment: 0, id: 'a1b2c3' }],
            assets: [],
            mappings: {
              '/post/title': {
                source: {
                  entry: 0,
                  field: 0,
                  locale: 0,
                },
              },
              '/post/subtitle': {
                source: {
                  entry: 0,
                  field: 1,
                  locale: 0,
                },
              },
            },
          },
        },
      };
      const encodedGraphQLResponse = encodeSourceMap(graphQLResponse);
      testEncodingDecoding(encodedGraphQLResponse.data.post, {
        '/title': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/foo/environments/master/entries/a1b2c3/?focusedField=title&focusedLocale=en-US',
          contentful: {
            space: 'foo',
            environment: 'master',
            field: 'title',
            locale: 'en-US',
            entity: 'a1b2c3',
            entityType: 'Entry',
          },
        },
        '/subtitle': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/foo/environments/master/entries/a1b2c3/?focusedField=subtitle&focusedLocale=en-US',
          contentful: {
            space: 'foo',
            environment: 'master',
            field: 'subtitle',
            locale: 'en-US',
            entity: 'a1b2c3',
            entityType: 'Entry',
          },
        },
      });
    });

    test('handles EU domain', () => {
      const graphQLResponse = {
        data: {
          post: {
            title: 'Title of the post',
            subtitle: 'Subtitle of the post',
          },
        },
        extensions: {
          contentSourceMaps: {
            version: 1.0,
            spaces: ['foo'],
            environments: ['master'],
            fields: ['title', 'subtitle'],
            locales: ['en-US'],
            entries: [{ space: 0, environment: 0, id: 'a1b2c3' }],
            assets: [],
            mappings: {
              '/post/title': {
                source: {
                  entry: 0,
                  field: 0,
                  locale: 0,
                },
              },
              '/post/subtitle': {
                source: {
                  entry: 0,
                  field: 1,
                  locale: 0,
                },
              },
            },
          },
        },
      };
      const encodedGraphQLResponse = encodeSourceMap(
        graphQLResponse,
        'https://app.eu.contentful.com',
      );
      testEncodingDecoding(encodedGraphQLResponse.data.post, {
        '/title': {
          origin: 'contentful.com',
          href: 'https://app.eu.contentful.com/spaces/foo/environments/master/entries/a1b2c3/?focusedField=title&focusedLocale=en-US',
          contentful: {
            space: 'foo',
            environment: 'master',
            field: 'title',
            locale: 'en-US',
            entity: 'a1b2c3',
            entityType: 'Entry',
          },
        },
        '/subtitle': {
          origin: 'contentful.com',
          href: 'https://app.eu.contentful.com/spaces/foo/environments/master/entries/a1b2c3/?focusedField=subtitle&focusedLocale=en-US',
          contentful: {
            space: 'foo',
            environment: 'master',
            field: 'subtitle',
            locale: 'en-US',
            entity: 'a1b2c3',
            entityType: 'Entry',
          },
        },
      });
    });

    test('collections', () => {
      const graphQLResponse = {
        data: {
          postCollection: {
            items: [
              {
                title: 'Title of the post',
              },
              {
                title: 'Title of the post 2',
              },
              {
                title: 'Title of the post 3',
              },
            ],
          },
        },
        extensions: {
          contentSourceMaps: {
            version: 1.0,
            spaces: ['foo'],
            environments: ['master'],
            fields: ['title'],
            locales: ['en-US'],
            entries: [
              { space: 0, environment: 0, id: 'a1b2c3' },
              { space: 0, environment: 0, id: 'd4e5f6' },
              { space: 0, environment: 0, id: 'g7h8i9' },
            ],
            assets: [],
            mappings: {
              '/postCollection/items/0/title': {
                source: {
                  entry: 0,
                  field: 0,
                  locale: 0,
                },
              },
              '/postCollection/items/1/title': {
                source: {
                  entry: 1,
                  field: 0,
                  locale: 0,
                },
              },
              '/postCollection/items/2/title': {
                source: {
                  entry: 2,
                  field: 0,
                  locale: 0,
                },
              },
            },
          },
        },
      };
      const encodedGraphQLResponse = encodeSourceMap(graphQLResponse);
      testEncodingDecoding(encodedGraphQLResponse.data.postCollection.items, {
        '/0': {
          title: {
            origin: 'contentful.com',
            href: 'https://app.contentful.com/spaces/foo/environments/master/entries/a1b2c3/?focusedField=title&focusedLocale=en-US',
            contentful: {
              space: 'foo',
              environment: 'master',
              field: 'title',
              locale: 'en-US',
              entity: 'a1b2c3',
              entityType: 'Entry',
            },
          },
        },
        '/1': {
          title: {
            origin: 'contentful.com',
            href: 'https://app.contentful.com/spaces/foo/environments/master/entries/d4e5f6/?focusedField=title&focusedLocale=en-US',
            contentful: {
              space: 'foo',
              environment: 'master',
              field: 'title',
              locale: 'en-US',
              entity: 'd4e5f6',
              entityType: 'Entry',
            },
          },
        },
        '/2': {
          title: {
            origin: 'contentful.com',
            href: 'https://app.contentful.com/spaces/foo/environments/master/entries/g7h8i9/?focusedField=title&focusedLocale=en-US',
            contentful: {
              space: 'foo',
              environment: 'master',
              field: 'title',
              locale: 'en-US',
              entity: 'g7h8i9',
              entityType: 'Entry',
            },
          },
        },
      });
    });

    test('aliasing with multiple locales', () => {
      const graphQLResponse = {
        data: {
          postCollection: {
            items: [
              {
                akanTitle: 'Lorem',
                aghemTitle: 'Ipsum',
                spanishTitle: 'Dolor',
              },
            ],
          },
        },
        extensions: {
          contentSourceMaps: {
            version: 1.0,
            spaces: ['foo'],
            environments: ['master'],
            fields: ['title'],
            locales: ['ak', 'agq', 'es'],
            entries: [{ space: 0, environment: 0, id: 'a1b2c3' }],
            assets: [],
            mappings: {
              '/postCollection/items/0/akanTitle': {
                source: {
                  entry: 0,
                  field: 0,
                  locale: 0,
                },
              },
              '/postCollection/items/0/aghemTitle': {
                source: {
                  entry: 0,
                  field: 0,
                  locale: 1,
                },
              },
              '/postCollection/items/0/spanishTitle': {
                source: {
                  entry: 0,
                  field: 0,
                  locale: 2,
                },
              },
            },
          },
        },
      };
      const encodedGraphQLResponse = encodeSourceMap(graphQLResponse);
      testEncodingDecoding(encodedGraphQLResponse.data.postCollection.items[0], {
        '/akanTitle': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/foo/environments/master/entries/a1b2c3/?focusedField=title&focusedLocale=ak',
          contentful: {
            space: 'foo',
            environment: 'master',
            field: 'title',
            locale: 'ak',
            entity: 'a1b2c3',
            entityType: 'Entry',
          },
        },
        '/aghemTitle': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/foo/environments/master/entries/a1b2c3/?focusedField=title&focusedLocale=agq',
          contentful: {
            space: 'foo',
            environment: 'master',
            field: 'title',
            locale: 'agq',
            entity: 'a1b2c3',
            entityType: 'Entry',
          },
        },
        '/spanishTitle': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/foo/environments/master/entries/a1b2c3/?focusedField=title&focusedLocale=es',
          contentful: {
            space: 'foo',
            environment: 'master',
            field: 'title',
            locale: 'es',
            entity: 'a1b2c3',
            entityType: 'Entry',
          },
        },
      });
    });

    test('it should ignore null rich text values', () => {
      const graphQLResponse = {
        data: {
          post: {
            // the graphql api won't return the json object if json empty
            // instead it will just have the field value as null
            rte: null,
          },
        },
        extensions: {
          contentSourceMaps: {
            version: 1,
            spaces: ['foo'],
            environments: ['master'],
            fields: ['rte'],
            locales: ['en-US'],
            entries: [{ space: 0, environment: 0, id: 'a1b2c3' }],
            assets: [],
            mappings: {
              '/post/rte/json': {
                source: {
                  entry: 0,
                  field: 0,
                  locale: 0,
                },
              },
            },
          },
        },
      };
      const encodedGraphQLResponse = encodeSourceMap(graphQLResponse);
      expect(encodedGraphQLResponse.data.post.rte).toBe(null);
    });

    test('works for rich text', () => {
      const graphQLResponse = {
        data: {
          post: {
            rte: {
              json: {
                nodeType: 'document',
                data: {},
                content: [
                  {
                    nodeType: 'paragraph',
                    data: {},
                    content: [
                      {
                        nodeType: 'text',
                        value: 'hello, world',
                        marks: [],
                        data: {},
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
        extensions: {
          contentSourceMaps: {
            version: 1,
            spaces: ['foo'],
            environments: ['master'],
            fields: ['rte'],
            locales: ['en-US'],
            entries: [
              {
                space: 0,
                environment: 0,
                id: 'a1b2c3',
              },
            ],
            assets: [],
            mappings: {
              '/post/rte/json': {
                source: {
                  entry: 0,
                  field: 0,
                  locale: 0,
                },
              },
            },
          },
        },
      };
      const encodedGraphQLResponse = encodeSourceMap(graphQLResponse);
      testEncodingDecoding(encodedGraphQLResponse.data.post, {
        '/rte/json/content/0/content/0/value': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/foo/environments/master/entries/a1b2c3/?focusedField=rte&focusedLocale=en-US',
          contentful: {
            space: 'foo',
            environment: 'master',
            field: 'rte',
            locale: 'en-US',
            entity: 'a1b2c3',
            entityType: 'Entry',
          },
        },
      });
    });

    test('does not encode dates', () => {
      const graphQLResponse = {
        data: {
          post: {
            date: '2023-12-13T00:00:00.000+01:00',
          },
        },
        extensions: {
          contentSourceMaps: {
            version: 1.0,
            spaces: ['foo'],
            environments: ['master'],
            fields: ['date'],
            locales: ['en-US'],
            entries: [{ space: 0, environment: 0, id: 'a1b2c3' }],
            assets: [],
            mappings: {
              '/post/date': {
                source: {
                  entry: 0,
                  field: 0,
                  locale: 0,
                },
              },
            },
          },
        },
      };
      const encodedGraphQLResponse = encodeSourceMap(graphQLResponse);

      testEncodingDecoding(encodedGraphQLResponse.data.post, {
        '/date': undefined,
      });
    });

    test('does not encode URLs', () => {
      const graphQLResponse = {
        data: {
          post: {
            url: 'https://test.com',
          },
        },
        extensions: {
          contentSourceMaps: {
            version: 1.0,
            spaces: ['foo'],
            environments: ['master'],
            fields: ['url'],
            locales: ['en-US'],
            entries: [{ space: 0, environment: 0, id: 'a1b2c3' }],
            assets: [],
            mappings: {
              '/post/url': {
                source: {
                  entry: 0,
                  field: 0,
                  locale: 0,
                },
              },
            },
          },
        },
      };
      const encodedGraphQLResponse = encodeSourceMap(graphQLResponse);

      testEncodingDecoding(encodedGraphQLResponse.data.post, {
        '/url': undefined,
      });
    });
  });
});
