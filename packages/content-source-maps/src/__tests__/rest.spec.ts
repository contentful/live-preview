import { describe, expect, test } from 'vitest';

import { decode } from '../encode.js';
import { encodeCPAResponse } from '../rest/encodeCPAResponse.js';
import type { CPAEntry, CPAEntryCollection } from '../types.js';
import {
  createAsset,
  createCPAEntryCollection,
  createEntry,
  testEncodingDecoding,
} from './utils.js';

describe('Content Source Maps with the CPA', () => {
  describe('entity collections', () => {
    // example: https://preview.contentful.com/spaces/:spaceId/entries?access_token=:accessToken&locale=*&includeContentSourceMaps=true
    test('with multiple locales in response', () => {
      const entry1 = createEntry({
        id: 'entryId',
        contentType: 'ctId',
        fields: {
          title: {
            'en-US': 'English title',
            af: 'Afrikaans title',
          },
          longText: {
            'en-US': 'English long text',
            af: 'Afrikaans long text',
          },
          richText: {
            'en-US': {
              data: {},
              content: [
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [],
                      value: 'Lorem ipsum english',
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
              ],
              nodeType: 'document',
            },
            af: {
              data: {},
              content: [
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [
                        {
                          type: 'bold',
                        },
                      ],
                      value: 'Lorem ipsum afrikaans',
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      content: [
                        {
                          data: {},
                          content: [
                            {
                              data: {},
                              marks: [],
                              value: 'list afrikaans',
                              nodeType: 'text',
                            },
                          ],
                          nodeType: 'paragraph',
                        },
                      ],
                      nodeType: 'list-item',
                    },
                  ],
                  nodeType: 'unordered-list',
                },
              ],
              nodeType: 'document',
            },
          },
          list: {
            'en-US': ['First English list item', 'Second English list item'],
            af: ['First Afrikaans list item'],
          },
        },
        contentSourceMaps: {
          sys: { type: 'ContentSourceMaps' },
          mappings: {
            'fields/title': {
              source: {
                fieldType: 0,
                editorInterface: 0,
              },
            },
            'fields/richText': {
              source: {
                fieldType: 1,
                editorInterface: 1,
              },
            },
            'fields/list': {
              source: {
                fieldType: 2,
                editorInterface: 2,
              },
            },
            'fields/longText': {
              source: {
                fieldType: 3,
                editorInterface: 3,
              },
            },
          },
        },
      });

      const entry2 = createEntry({
        id: 'entry2Id',
        contentType: 'ctId',
        fields: {
          title: {
            'en-US': 'English entry 2 title',
          },
          richText: {
            'en-US': {
              data: {},
              content: [
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [],
                      value: 'Entry 2 english',
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
              ],
              nodeType: 'document',
            },
          },
        },
        contentSourceMaps: {
          sys: { type: 'ContentSourceMaps' },
          mappings: {
            'fields/title': {
              source: {
                fieldType: 0,
                editorInterface: 0,
              },
            },
            'fields/richText': {
              source: {
                fieldType: 1,
                editorInterface: 1,
              },
            },
          },
        },
      });

      const asset = createAsset({
        id: 'assetId',
        fields: {
          title: {
            'en-US': 'English asset title',
          },
          description: {
            'en-US': 'English asset description',
          },
        },
        contentSourceMaps: {
          sys: { type: 'ContentSourceMaps' },
          mappings: {
            'fields/title': {
              source: {
                fieldType: 0,
                editorInterface: 0,
              },
            },
          },
        },
      });

      const CPAResponse = createCPAEntryCollection({
        items: [entry1],
        includes: {
          Entry: [entry2],
          Asset: [asset],
        },
        contentSourceMapsLookup: {
          sys: {
            type: 'ContentSourceMapsLookup',
          },
          editorInterfaces: [
            {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
            {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
            {
              widgetId: 'tagEditor',
              widgetNamespace: 'builtin',
            },
            {
              widgetId: 'multipleLine',
              widgetNamespace: 'builtin',
            },
          ],
          fieldTypes: ['Symbol', 'RichText', 'Array', 'Text'],
        },
      });

      const encodedCPAResponse = encodeCPAResponse(CPAResponse) as CPAEntryCollection;

      const mappings = {
        '/items/0/fields/title/en-US': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=title&focusedLocale=en-US&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'title',
            locale: 'en-US',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
            fieldType: 'Symbol',
          },
        },
        '/items/0/fields/title/af': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=title&focusedLocale=af&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'title',
            locale: 'af',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
            fieldType: 'Symbol',
          },
        },
        '/items/0/fields/longText/en-US': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=longText&focusedLocale=en-US&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'longText',
            locale: 'en-US',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'multipleLine',
              widgetNamespace: 'builtin',
            },
            fieldType: 'Text',
          },
        },
        '/items/0/fields/longText/af': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=longText&focusedLocale=af&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'longText',
            locale: 'af',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'multipleLine',
              widgetNamespace: 'builtin',
            },
            fieldType: 'Text',
          },
        },
        '/items/0/fields/richText/en-US/content/0/content/0/value': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=richText&focusedLocale=en-US&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'richText',
            locale: 'en-US',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
            fieldType: 'RichText',
          },
        },
        '/items/0/fields/richText/af/content/0/content/0/value': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=richText&focusedLocale=af&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'richText',
            locale: 'af',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
            fieldType: 'RichText',
          },
        },
        '/items/0/fields/richText/af/content/1/content/0/content/0/content/0/value': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=richText&focusedLocale=af&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'richText',
            locale: 'af',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
            fieldType: 'RichText',
          },
        },
        '/includes/Entry/0/fields/title/en-US': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entry2Id/?focusedField=title&focusedLocale=en-US&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'title',
            locale: 'en-US',
            entity: 'entry2Id',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
            fieldType: 'Symbol',
          },
        },
        '/includes/Entry/0/fields/richText/en-US/content/0/content/0/value': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entry2Id/?focusedField=richText&focusedLocale=en-US&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'richText',
            locale: 'en-US',
            entity: 'entry2Id',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
            fieldType: 'RichText',
          },
        },
        '/includes/Asset/0/fields/title/en-US': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/assets/assetId/?focusedField=title&focusedLocale=en-US&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'title',
            locale: 'en-US',
            entity: 'assetId',
            entityType: 'Asset',
            editorInterface: {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
            fieldType: 'Symbol',
          },
        },
      };

      // Check Array of Symbols
      encodedCPAResponse.items[0].fields.list['en-US'].forEach((item: string) => {
        const decodedValue = decode(item);
        expect(decodedValue).toEqual({
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=list&focusedLocale=en-US&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'list',
            locale: 'en-US',
            entity: 'entryId',
            entityType: 'Entry',
            fieldType: 'Array',
            editorInterface: {
              widgetId: 'tagEditor',
              widgetNamespace: 'builtin',
            },
          },
        });
      });

      testEncodingDecoding(encodedCPAResponse, mappings);
    });

    // example: https://preview.contentful.com/spaces/:spaceId/entries?access_token=:accessToken&locale=af&includeContentSourceMaps=true
    test('with single locale in response', () => {
      const entry = createEntry({
        id: 'entryId',
        contentType: 'ctId',
        fields: {
          title: 'Afrikaans title',
          richText: {
            data: {},
            content: [
              {
                data: {},
                content: [
                  {
                    data: {},
                    marks: [],
                    value: 'Lorem ipsum single locale afrikaans',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'paragraph',
              },
            ],
            nodeType: 'document',
          },
          list: ['First Afrikaans list item', 'Second Afrikaans list item'],
        },
        locale: 'af', // sys.locale will be included since we only have one locale in the response
        contentSourceMaps: {
          sys: { type: 'ContentSourceMaps' },
          mappings: {
            'fields/title': {
              source: {
                fieldType: 0,
                editorInterface: 0,
              },
            },
            'fields/richText': {
              source: {
                fieldType: 1,
                editorInterface: 1,
              },
            },
            'fields/list': {
              source: {
                fieldType: 2,
                editorInterface: 2,
              },
            },
          },
        },
      });

      const CPAResponse = createCPAEntryCollection({
        items: [entry],
        contentSourceMapsLookup: {
          sys: {
            type: 'ContentSourceMapsLookup',
          },
          editorInterfaces: [
            {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
            {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
            {
              widgetId: 'listInput',
              widgetNamespace: 'builtin',
            },
          ],
          fieldTypes: ['Symbol', 'RichText', 'Array'],
        },
      });

      const encodedCPAResponse = encodeCPAResponse(CPAResponse) as CPAEntryCollection;

      const mappings = {
        '/items/0/fields/title': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=title&focusedLocale=af&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'title',
            locale: 'af',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
            fieldType: 'Symbol',
          },
        },
        '/items/0/fields/richText/content/0/content/0/value': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=richText&focusedLocale=af&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'richText',
            locale: 'af',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
            fieldType: 'RichText',
          },
        },
      };

      // Check Array of Symbols
      encodedCPAResponse.items[0].fields.list.forEach((item: string) => {
        const decodedValue = decode(item);
        expect(decodedValue).toEqual({
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=list&focusedLocale=af&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'list',
            locale: 'af',
            entity: 'entryId',
            entityType: 'Entry',
            fieldType: 'Array',
            editorInterface: {
              widgetId: 'listInput',
              widgetNamespace: 'builtin',
            },
          },
        });
      });

      testEncodingDecoding(encodedCPAResponse, mappings);
    });
  });

  describe('single entity', () => {
    // example: https://preview.contentful.com/spaces/:spaceId/entries/:entryId?access_token=:accessToken&locale=*&includeContentSourceMaps=true
    test('with multiple locales in response', () => {
      const CPAResponse = createEntry({
        id: 'entryId',
        contentType: 'ctId',
        fields: {
          title: {
            'en-US': 'English title',
            af: 'Afrikaans title',
            'nl-BE': 'Flemish title',
          },
          checkboxes: {
            'nl-BE': ['First Flemish list item', 'Second Flemish list item'],
          },
          richText: {
            'en-US': {
              data: {},
              content: [
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [],
                      value: 'Lorem ipsum english',
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
              ],
              nodeType: 'document',
            },
            af: {
              data: {},
              content: [
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [
                        {
                          type: 'bold',
                        },
                      ],
                      value: 'Lorem ipsum afrikaans',
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      content: [
                        {
                          data: {},
                          content: [
                            {
                              data: {},
                              marks: [],
                              value: 'list afrikaans',
                              nodeType: 'text',
                            },
                          ],
                          nodeType: 'paragraph',
                        },
                      ],
                      nodeType: 'list-item',
                    },
                  ],
                  nodeType: 'unordered-list',
                },
              ],
              nodeType: 'document',
            },
            'nl-BE': {
              data: {},
              content: [
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [],
                      value: 'Lorem ipsum Flemish',
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
              ],
              nodeType: 'document',
            },
          },
        },
        contentSourceMapsLookup: {
          sys: {
            type: 'ContentSourceMapsLookup',
          },
          editorInterfaces: [
            {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
            {
              widgetId: 'checkbox',
              widgetNamespace: 'builtin',
            },
            {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
          ],
          fieldTypes: ['Symbol', 'Array', 'RichText'],
        },
        contentSourceMaps: {
          sys: { type: 'ContentSourceMaps' },
          mappings: {
            '/fields/title': {
              source: {
                fieldType: 0,
                editorInterface: 0,
              },
            },
            '/fields/checkboxes': {
              source: {
                fieldType: 1,
                editorInterface: 1,
              },
            },
            '/fields/richText': {
              source: {
                fieldType: 2,
                editorInterface: 2,
              },
            },
          },
        },
      });

      const encodedCPAResponse = encodeCPAResponse(CPAResponse) as CPAEntry;

      const mappings = {
        '/fields/title/en-US': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=title&focusedLocale=en-US&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'title',
            locale: 'en-US',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
            fieldType: 'Symbol',
          },
        },
        '/fields/title/af': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=title&focusedLocale=af&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'title',
            locale: 'af',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
            fieldType: 'Symbol',
          },
        },
        '/fields/title/nl-BE': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=title&focusedLocale=nl-BE&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'title',
            locale: 'nl-BE',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
            fieldType: 'Symbol',
          },
        },
        '/fields/richText/en-US/content/0/content/0/value': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=richText&focusedLocale=en-US&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'richText',
            locale: 'en-US',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
            fieldType: 'RichText',
          },
        },
        '/fields/richText/af/content/0/content/0/value': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=richText&focusedLocale=af&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'richText',
            locale: 'af',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
            fieldType: 'RichText',
          },
        },
        '/fields/richText/af/content/1/content/0/content/0/content/0/value': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=richText&focusedLocale=af&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'richText',
            locale: 'af',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
            fieldType: 'RichText',
          },
        },
        '/fields/richText/nl-BE/content/0/content/0/value': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=richText&focusedLocale=nl-BE&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'richText',
            locale: 'nl-BE',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
            fieldType: 'RichText',
          },
        },
      };

      // Check Array of Symbols
      encodedCPAResponse.fields.checkboxes['nl-BE'].forEach((item: string) => {
        const decodedValue = decode(item);
        expect(decodedValue).toEqual({
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=checkboxes&focusedLocale=nl-BE&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'checkboxes',
            locale: 'nl-BE',
            entity: 'entryId',
            entityType: 'Entry',
            fieldType: 'Array',
            editorInterface: {
              widgetId: 'checkbox',
              widgetNamespace: 'builtin',
            },
          },
        });
      });

      testEncodingDecoding(encodedCPAResponse, mappings);
    });

    // example: https://preview.contentful.com/spaces/:spaceId/entries/:entryId?access_token=:accessToken&includeContentSourceMaps=true
    test('with single locale in response', () => {
      const CPAResponse = createEntry({
        id: 'entryId',
        contentType: 'ctId',
        fields: {
          richText: {
            data: {},
            content: [
              {
                data: {},
                content: [
                  {
                    data: {},
                    marks: [],
                    value: 'Lorem ipsum single locale english',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'paragraph',
              },
            ],
            nodeType: 'document',
          },
          title: 'English title',
        },
        locale: 'en-US', // sys.locale will be included since we only have one locale in the response
        contentSourceMapsLookup: {
          sys: {
            type: 'ContentSourceMapsLookup',
          },
          editorInterfaces: [
            {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
            {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
          ],
          fieldTypes: ['RichText', 'Symbol'],
        },
        contentSourceMaps: {
          sys: { type: 'ContentSourceMaps' },
          mappings: {
            '/fields/richText': {
              source: {
                fieldType: 0,
                editorInterface: 0,
              },
            },
            '/fields/title': {
              source: {
                fieldType: 1,
                editorInterface: 1,
              },
            },
          },
        },
      });

      const encodedCPAResponse = encodeCPAResponse(CPAResponse) as CPAEntry;

      const mappings = {
        '/fields/title': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=title&focusedLocale=en-US&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'title',
            locale: 'en-US',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
            fieldType: 'Symbol',
          },
        },
        '/fields/richText/content/0/content/0/value': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=richText&focusedLocale=en-US&source=vercel-content-link',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'richText',
            locale: 'en-US',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
            fieldType: 'RichText',
          },
        },
      };

      testEncodingDecoding(encodedCPAResponse, mappings);
    });
  });

  describe('allows configuring a platform to reduce the payload', () => {
    const response = createEntry({
      id: 'entryId',
      contentType: 'ctId',
      fields: {
        richText: {
          data: {},
          content: [
            {
              data: {},
              content: [
                {
                  data: {},
                  marks: [],
                  value: 'Lorem ipsum single locale english',
                  nodeType: 'text',
                },
              ],
              nodeType: 'paragraph',
            },
          ],
          nodeType: 'document',
        },
        title: 'English title',
      },
      locale: 'en-US', // sys.locale will be included since we only have one locale in the response
      contentSourceMapsLookup: {
        sys: {
          type: 'ContentSourceMapsLookup',
        },
        editorInterfaces: [
          {
            widgetId: 'richTextEditor',
            widgetNamespace: 'builtin',
          },
          {
            widgetId: 'singleLine',
            widgetNamespace: 'builtin',
          },
        ],
        fieldTypes: ['RichText', 'Symbol'],
      },
      contentSourceMaps: {
        sys: { type: 'ContentSourceMaps' },
        mappings: {
          '/fields/richText': {
            source: {
              fieldType: 0,
              editorInterface: 0,
            },
          },
          '/fields/title': {
            source: {
              fieldType: 1,
              editorInterface: 1,
            },
          },
        },
      },
    });

    test('setting the platform to vercel removes the contentful information', () => {
      const encodedCPAResponse = encodeCPAResponse(
        response,
        'https://app.contentful.com',
        'vercel',
      ) as CPAEntry;

      const mappings = {
        '/fields/title': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=title&focusedLocale=en-US&source=vercel-content-link',
        },
        '/fields/richText/content/0/content/0/value': {
          origin: 'contentful.com',
          href: 'https://app.contentful.com/spaces/spaceId/environments/master/entries/entryId/?focusedField=richText&focusedLocale=en-US&source=vercel-content-link',
        },
      };

      testEncodingDecoding(encodedCPAResponse, mappings);
    });

    test('setting the platform to contentful removes the href information', () => {
      const encodedCPAResponse = encodeCPAResponse(
        response,
        'https://app.contentful.com',
        'contentful',
      ) as CPAEntry;

      const mappings = {
        '/fields/title': {
          origin: 'contentful.com',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'title',
            locale: 'en-US',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'singleLine',
              widgetNamespace: 'builtin',
            },
            fieldType: 'Symbol',
          },
        },
        '/fields/richText/content/0/content/0/value': {
          origin: 'contentful.com',
          contentful: {
            space: 'spaceId',
            environment: 'master',
            field: 'richText',
            locale: 'en-US',
            entity: 'entryId',
            entityType: 'Entry',
            editorInterface: {
              widgetId: 'richTextEditor',
              widgetNamespace: 'builtin',
            },
            fieldType: 'RichText',
          },
        },
      };

      testEncodingDecoding(encodedCPAResponse, mappings);
    });
  });
});
