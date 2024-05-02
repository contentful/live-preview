import { get } from 'json-pointer';
import { describe, expect, test } from 'vitest';

import { decode } from '../encode.js';
import { encodeGraphQLResponse } from '../graphql/encodeGraphQLResponse.js';
import { GraphQLResponse } from '../types.js';
import { testEncodingDecoding } from './utils.js';

const UNSUPPORTED_WIDGETS = [
  'boolean',
  'objectEditor',
  'datePicker',
  'locationEditor',
  'rating',
  'radio',
  'numberEditor',
  'urlEditor',
  'slugEditor',
  'dropdown',
  'entryLinkEditor',
  'entryCardEditor',
  'entryLinksEditor',
  'entryCardsEditor',
  'assetLinkEditor',
  'assetLinksEditor',
  'assetGalleryEditor',
];

describe('Content Source Maps with the GraphQL API', () => {
  test('works for Symbol fields', () => {
    const graphQLResponse: GraphQLResponse = {
      data: {
        post: {
          title: 'Title of the post',
          subtitle: 'Subtitle of the post',
        },
      },
      extensions: {
        contentSourceMaps: {
          spaces: ['foo'],
          environments: ['master'],
          fieldTypes: ['Symbol'],
          editorInterfaces: [
            {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
          ],
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
                fieldType: 0,
                editorInterface: 0,
              },
            },
            '/post/subtitle': {
              source: {
                entry: 0,
                field: 1,
                locale: 0,
                fieldType: 0,
                editorInterface: 0,
              },
            },
          },
        },
      },
    };
    const encodedGraphQLResponse = encodeGraphQLResponse(graphQLResponse);
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
          editorInterface: {
            widgetId: 'singleLine',
            widgetNamespace: 'builtin',
          },
          fieldType: 'Symbol',
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
          editorInterface: {
            widgetId: 'singleLine',
            widgetNamespace: 'builtin',
          },
          fieldType: 'Symbol',
        },
      },
    });
  });

  test('works for lists of Symbol fields', () => {
    const graphQLResponse: GraphQLResponse = {
      data: {
        post: {
          list: ['item1', 'item2'],
        },
      },
      extensions: {
        contentSourceMaps: {
          spaces: ['foo'],
          environments: ['master'],
          fieldTypes: ['Array'],
          editorInterfaces: [
            {
              widgetId: 'listInput',
              widgetNamespace: 'builtin',
            },
          ],
          fields: ['list'],
          locales: ['en-US'],
          entries: [{ space: 0, environment: 0, id: 'a1b2c3' }],
          assets: [],
          mappings: {
            '/post/list': {
              source: {
                entry: 0,
                field: 0,
                locale: 0,
                fieldType: 0,
                editorInterface: 0,
              },
            },
          },
        },
      },
    };
    const encodedGraphQLResponse = encodeGraphQLResponse(graphQLResponse);
    encodedGraphQLResponse.data.post.list.forEach((item: string) => {
      const decodedValue = decode(item);
      expect(decodedValue).toEqual({
        origin: 'contentful.com',
        href: 'https://app.contentful.com/spaces/foo/environments/master/entries/a1b2c3/?focusedField=list&focusedLocale=en-US',
        contentful: {
          space: 'foo',
          environment: 'master',
          field: 'list',
          locale: 'en-US',
          entity: 'a1b2c3',
          entityType: 'Entry',
          fieldType: 'Array',
          editorInterface: {
            widgetId: 'listInput',
            widgetNamespace: 'builtin',
          },
        },
      });
    });
  });

  test('it should ignore null values', () => {
    const graphQLResponse: GraphQLResponse = {
      data: {
        post: {
          title: null,
          subtitle: null,
        },
      },
      extensions: {
        contentSourceMaps: {
          spaces: ['foo'],
          environments: ['master'],
          fieldTypes: ['Symbol'],
          editorInterfaces: [
            {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
          ],
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
                fieldType: 0,
                editorInterface: 0,
              },
            },
            '/post/subtitle': {
              source: {
                entry: 0,
                field: 1,
                locale: 0,
                fieldType: 0,
                editorInterface: 0,
              },
            },
          },
        },
      },
    };
    const encodedGraphQLResponse = encodeGraphQLResponse(graphQLResponse);
    expect(encodedGraphQLResponse.data.post.title).toBeNull();
    expect(encodedGraphQLResponse.data.post.subtitle).toBeNull();
  });

  test('handles EU domain', () => {
    const graphQLResponse: GraphQLResponse = {
      data: {
        post: {
          title: 'Title of the post',
          subtitle: 'Subtitle of the post',
        },
      },
      extensions: {
        contentSourceMaps: {
          spaces: ['foo'],
          environments: ['master'],
          fieldTypes: ['Symbol'],
          editorInterfaces: [
            {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
          ],
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
                fieldType: 0,
                editorInterface: 0,
              },
            },
            '/post/subtitle': {
              source: {
                entry: 0,
                field: 1,
                locale: 0,
                fieldType: 0,
                editorInterface: 0,
              },
            },
          },
        },
      },
    };
    const encodedGraphQLResponse = encodeGraphQLResponse(
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
          editorInterface: {
            widgetId: 'singleLine',
            widgetNamespace: 'builtin',
          },
          fieldType: 'Symbol',
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
          editorInterface: {
            widgetId: 'singleLine',
            widgetNamespace: 'builtin',
          },
          fieldType: 'Symbol',
        },
      },
    });
  });

  test('collections', () => {
    const graphQLResponse: GraphQLResponse = {
      data: {
        postCollection: {
          items: [
            {
              title: 'Title of the first post',
            },
            {
              title: 'Title of the second post',
            },
            {
              title: 'Title of the third post',
            },
          ],
        },
      },
      extensions: {
        contentSourceMaps: {
          spaces: ['foo'],
          environments: ['master'],
          fieldTypes: ['Symbol'],
          editorInterfaces: [
            {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
          ],
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
                fieldType: 0,
                editorInterface: 0,
              },
            },
            '/postCollection/items/1/title': {
              source: {
                entry: 1,
                field: 0,
                locale: 0,
                fieldType: 0,
                editorInterface: 0,
              },
            },
            '/postCollection/items/2/title': {
              source: {
                entry: 2,
                field: 0,
                locale: 0,
                fieldType: 0,
                editorInterface: 0,
              },
            },
          },
        },
      },
    };
    const encodedGraphQLResponse = encodeGraphQLResponse(graphQLResponse);
    encodedGraphQLResponse.data.postCollection.items.forEach(
      (item: { title: string }, index: number) => {
        const baseUrl = 'https://app.contentful.com';
        const spaceId = 'foo';
        const environment = 'master';
        const entityType = 'Entry';
        const field = 'title';
        const locale = 'en-US';
        const entityIds = ['a1b2c3', 'd4e5f6', 'g7h8i9'];
        const entityId = entityIds[index];
        const expected = {
          origin: 'contentful.com',
          href: `${baseUrl}/spaces/${spaceId}/environments/${environment}/entries/${entityId}/?focusedField=${field}&focusedLocale=${locale}`,
          contentful: {
            space: spaceId,
            environment,
            field,
            locale,
            entity: entityId,
            entityType,
            editorInterface: {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
            fieldType: 'Symbol',
          },
        };
        const decodedValue = decode(item.title);
        expect(decodedValue).toEqual(expected);
      },
    );
  });

  test('aliasing with multiple locales', () => {
    const graphQLResponse: GraphQLResponse = {
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
          spaces: ['foo'],
          environments: ['master'],
          fieldTypes: ['Symbol'],
          editorInterfaces: [
            {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
          ],
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
                fieldType: 0,
                editorInterface: 0,
              },
            },
            '/postCollection/items/0/aghemTitle': {
              source: {
                entry: 0,
                field: 0,
                locale: 1,
                fieldType: 0,
                editorInterface: 0,
              },
            },
            '/postCollection/items/0/spanishTitle': {
              source: {
                entry: 0,
                field: 0,
                locale: 2,
                fieldType: 0,
                editorInterface: 0,
              },
            },
          },
        },
      },
    };
    const encodedGraphQLResponse = encodeGraphQLResponse(graphQLResponse);
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
          editorInterface: {
            widgetId: 'singleLine',
            widgetNamespace: 'builtin',
          },
          fieldType: 'Symbol',
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
          editorInterface: {
            widgetId: 'singleLine',
            widgetNamespace: 'builtin',
          },
          fieldType: 'Symbol',
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
          editorInterface: {
            widgetId: 'singleLine',
            widgetNamespace: 'builtin',
          },
          fieldType: 'Symbol',
        },
      },
    });
  });

  test('it should ignore null rich text values', () => {
    const graphQLResponse: GraphQLResponse = {
      data: {
        post: {
          // the graphql api won't return the json object if json empty
          // instead it will just have the field value as null
          rte: null,
        },
      },
      extensions: {
        contentSourceMaps: {
          spaces: ['foo'],
          environments: ['master'],
          fieldTypes: ['RichText'],
          editorInterfaces: [
            {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
          ],
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
                fieldType: 0,
                editorInterface: 0,
              },
            },
          },
        },
      },
    };
    const encodedGraphQLResponse = encodeGraphQLResponse(graphQLResponse);
    expect(encodedGraphQLResponse.data.post.rte).toBeNull();
  });

  test('works for rich text', () => {
    const graphQLResponse: GraphQLResponse = {
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
                      value: 'hello, ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'embedded-entry-inline',
                      data: {
                        target: {
                          sys: {
                            id: 'd4e5f6',
                            type: 'Link',
                            linkType: 'Entry',
                          },
                        },
                      },
                      content: [],
                    },
                    {
                      nodeType: 'text',
                      value: ' world',
                      marks: [],
                      data: {},
                    },
                    {
                      data: {
                        target: {
                          sys: {
                            id: '5Ffob3XoJGrQuKE5uRUugR',
                            type: 'Link',
                            linkType: 'Entry',
                          },
                        },
                      },
                      content: [
                        {
                          data: {},
                          marks: [],
                          value: 'Hyperlink to another entry',
                          nodeType: 'text',
                        },
                      ],
                      nodeType: 'entry-hyperlink',
                    },
                    {
                      data: {
                        uri: 'https://google.de',
                      },
                      content: [
                        {
                          data: {},
                          marks: [],
                          value: 'Hyperlink to external',
                          nodeType: 'text',
                        },
                      ],
                      nodeType: 'hyperlink',
                    },
                  ],
                },
              ],
            },
            links: {
              entries: {
                hyperlink: [
                  {
                    __typename: 'PageBlogPost',
                    sys: {
                      id: '5Ffob3XoJGrQuKE5uRUugR',
                    },
                    slug: '1exploring-the-intersection-of-technology-and-art',
                  },
                ],
              },
            },
          },
        },
      },
      extensions: {
        contentSourceMaps: {
          spaces: ['foo'],
          environments: ['master'],
          fieldTypes: ['RichText', 'Symbol'],
          editorInterfaces: [
            {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
            {
              widgetId: 'slugEditor',
              widgetNamespace: 'builtin',
            },
          ],
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
                editorInterface: 0,
                entry: 0,
                field: 0,
                fieldType: 0,
                locale: 0,
              },
            },
            '/post/rte/links/entries/hyperlink/0/slug': {
              source: {
                editorInterface: 1,
                entry: 0,
                field: 0,
                fieldType: 1,
                locale: 0,
              },
            },
          },
        },
      },
    };
    const encodedGraphQLResponse = encodeGraphQLResponse(graphQLResponse);
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
          editorInterface: {
            widgetId: 'richTextEditor',
            widgetNamespace: 'builtin',
          },
          fieldType: 'RichText',
        },
      },
      '/rte/json/content/0/content/2/value': {
        origin: 'contentful.com',
        href: 'https://app.contentful.com/spaces/foo/environments/master/entries/a1b2c3/?focusedField=rte&focusedLocale=en-US',
        contentful: {
          space: 'foo',
          environment: 'master',
          field: 'rte',
          locale: 'en-US',
          entity: 'a1b2c3',
          entityType: 'Entry',
          editorInterface: {
            widgetId: 'richTextEditor',
            widgetNamespace: 'builtin',
          },
          fieldType: 'RichText',
        },
      },
      // entry hyperlinks
      '/rte/json/content/0/content/3/content/0/value': {
        origin: 'contentful.com',
        href: 'https://app.contentful.com/spaces/foo/environments/master/entries/a1b2c3/?focusedField=rte&focusedLocale=en-US',
        contentful: {
          space: 'foo',
          environment: 'master',
          field: 'rte',
          locale: 'en-US',
          entity: 'a1b2c3',
          entityType: 'Entry',
          editorInterface: {
            widgetId: 'richTextEditor',
            widgetNamespace: 'builtin',
          },
          fieldType: 'RichText',
        },
      },
      '/rte/links/entries/hyperlink/0/slug': undefined,
      // external links
      '/rte/json/content/0/content/4/data/uri': undefined,
      '/rte/json/content/0/content/4/content/0/value': {
        origin: 'contentful.com',
        href: 'https://app.contentful.com/spaces/foo/environments/master/entries/a1b2c3/?focusedField=rte&focusedLocale=en-US',
        contentful: {
          space: 'foo',
          environment: 'master',
          field: 'rte',
          locale: 'en-US',
          entity: 'a1b2c3',
          entityType: 'Entry',
          editorInterface: {
            widgetId: 'richTextEditor',
            widgetNamespace: 'builtin',
          },
          fieldType: 'RichText',
        },
      },
    });

    // should throw an error if we try to access non-text nodes
    try {
      get(encodedGraphQLResponse.data.post, '/rte/json/content/0/content/1/value');
    } catch (error) {
      expect((error as Error).message).toBe('Invalid reference token: value');
    }
  });

  test('does not encode dates even if they are coming from a supported editor interface', () => {
    const graphQLResponse: GraphQLResponse = {
      data: {
        post: {
          date: '2023-12-13T00:00:00.000+01:00',
        },
      },
      extensions: {
        contentSourceMaps: {
          spaces: ['foo'],
          environments: ['master'],
          fieldTypes: ['Symbol'],
          editorInterfaces: [
            {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
          ],
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
                fieldType: 0,
                editorInterface: 0,
              },
            },
          },
        },
      },
    };
    const encodedGraphQLResponse = encodeGraphQLResponse(graphQLResponse);

    testEncodingDecoding(encodedGraphQLResponse.data.post, {
      '/date': undefined,
    });
  });

  test('does not encode URLs even if they are coming from a supported editor interface', () => {
    const graphQLResponse: GraphQLResponse = {
      data: {
        post: {
          url: 'https://test.com',
        },
      },
      extensions: {
        contentSourceMaps: {
          spaces: ['foo'],
          environments: ['master'],
          fieldTypes: ['Symbol'],
          editorInterfaces: [
            {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
          ],
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
                fieldType: 0,
                editorInterface: 0,
              },
            },
          },
        },
      },
    };
    const encodedGraphQLResponse = encodeGraphQLResponse(graphQLResponse);

    testEncodingDecoding(encodedGraphQLResponse.data.post, {
      '/url': undefined,
    });
  });

  describe('editor interfaces', () => {
    UNSUPPORTED_WIDGETS.forEach((widget) => {
      test(`does not encode ${widget}`, () => {
        const graphQLResponse: GraphQLResponse = {
          data: {
            post: {
              foo: 'bar',
            },
          },
          extensions: {
            contentSourceMaps: {
              spaces: ['spaceId'],
              environments: ['master'],
              fieldTypes: ['Symbol'],
              editorInterfaces: [
                {
                  widgetId: widget,
                  widgetNamespace: 'builtin',
                },
              ],
              fields: ['foo'],
              locales: ['en-US'],
              entries: [{ space: 0, environment: 0, id: 'a1b2c3' }],
              assets: [],
              mappings: {
                '/post/foo': {
                  source: {
                    entry: 0,
                    field: 0,
                    locale: 0,
                    fieldType: 0,
                    editorInterface: 0,
                  },
                },
              },
            },
          },
        };
        const encodedGraphQLResponse = encodeGraphQLResponse(graphQLResponse);
        testEncodingDecoding(encodedGraphQLResponse.data.post, {
          '/foo': undefined,
        });
      });
    });

    test('does not encode unsupported widgets as part of a more complex response', () => {
      const graphQLResponse: GraphQLResponse = {
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
                        value: 'hello, ',
                        marks: [],
                        data: {},
                      },
                      {
                        nodeType: 'embedded-entry-inline',
                        data: {
                          target: {
                            sys: {
                              id: 'd4e5f6',
                              type: 'Link',
                              linkType: 'Entry',
                            },
                          },
                        },
                        content: [],
                      },
                      {
                        nodeType: 'text',
                        value: ' world',
                        marks: [],
                        data: {},
                      },
                    ],
                  },
                ],
              },
            },
            title: 'test',
            foo: 'bar',
          },
        },
        extensions: {
          contentSourceMaps: {
            spaces: ['spaceId'],
            environments: ['master'],
            fieldTypes: ['RichText', 'Symbol'],
            editorInterfaces: [
              {
                widgetId: 'richTextEditor',
                widgetNamespace: 'builtin',
              },
              {
                widgetId: 'singleLine',
                widgetNamespace: 'builtin',
              },
              {
                widgetId: 'dropdown',
                widgetNamespace: 'builtin',
              },
            ],
            fields: ['rte', 'title', 'foo'],
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
                  fieldType: 0,
                  editorInterface: 0,
                },
              },
              '/post/title': {
                source: {
                  entry: 0,
                  field: 1,
                  locale: 0,
                  fieldType: 1,
                  editorInterface: 1,
                },
              },
              '/post/foo': {
                source: {
                  entry: 0,
                  field: 2,
                  locale: 0,
                  fieldType: 1,
                  editorInterface: 2,
                },
              },
            },
          },
        },
      };
      const encodedGraphQLResponse = encodeGraphQLResponse(graphQLResponse);
      testEncodingDecoding(encodedGraphQLResponse.data.post, {
        '/rte/json/content/0/content/0/value': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/a1b2c3/?focusedField=rte&focusedLocale=en-US',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'rte',
            locale: 'en-US',
            entity: 'a1b2c3',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
            fieldType: 'RichText',
          },
        },
        '/rte/json/content/0/content/2/value': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/a1b2c3/?focusedField=rte&focusedLocale=en-US',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'rte',
            locale: 'en-US',
            entity: 'a1b2c3',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
            fieldType: 'RichText',
          },
        },
        '/title': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/a1b2c3/?focusedField=title&focusedLocale=en-US',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'title',
            locale: 'en-US',
            entity: 'a1b2c3',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
            fieldType: 'Symbol',
          },
        },
        '/foo': undefined,
      });
    });

    test('always encodes custom widgets', () => {
      const graphQLResponse: GraphQLResponse = {
        data: {
          post: {
            title: 'bar',
          },
        },
        extensions: {
          contentSourceMaps: {
            spaces: ['spaceId'],
            environments: ['master'],
            fieldTypes: ['Symbol'],
            editorInterfaces: [
              {
                widgetId: 'radio', //can be any value
                widgetNamespace: 'app',
              },
            ],
            fields: ['title'],
            locales: ['en-US'],
            entries: [{ space: 0, environment: 0, id: 'a1b2c3' }],
            assets: [],
            mappings: {
              '/post/title': {
                source: {
                  entry: 0,
                  field: 0,
                  locale: 0,
                  fieldType: 0,
                  editorInterface: 0,
                },
              },
            },
          },
        },
      };
      const encodedGraphQLResponse = encodeGraphQLResponse(graphQLResponse);
      testEncodingDecoding(encodedGraphQLResponse.data.post, {
        '/title': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/a1b2c3/?focusedField=title&focusedLocale=en-US',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'title',
            locale: 'en-US',
            entity: 'a1b2c3',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'radio',
              widgetNamespace: 'app',
            },
            fieldType: 'Symbol',
          },
        },
      });
    });
  });
});
