import { Document } from '@contentful/rich-text-types';
import type { Asset, Entry } from 'contentful';

import { patchField } from '../utils';
import dataFromPreviewApp from './dataFromPreviewApp.json';
import entry from './updateFromEntryEditor.json';

export const newEntryReference = {
  sys: { id: 'new-entry-id' },
  fields: {
    headline: 'Hello',
  },
} as unknown as Entry;

export const newAssetReference = {
  sys: { id: 'new-asset-id', linkType: 'Asset' },
  fields: {
    title: 'New Asset',
    file: { url: 'https://app.contentful.com/newAsset.png' },
  },
} as unknown as Asset;

export const defaultResult = {
  ...dataFromPreviewApp,
  fields: {
    ...dataFromPreviewApp.fields,
    // updated data:
    shortText: entry.fields.shortText,
    shortTextUrl: entry.fields.shortTextUrl,
    shortTextSlug: entry.fields.shortTextSlug,
    longTextMultiple: entry.fields.longTextMultiple,
    richText: entry.fields.richText,
    numberInteger: entry.fields.numberInteger,
    numberDecimal: entry.fields.numberDecimal,
    dateTime: entry.fields.dateTime,
    location: entry.fields.location,
    boolean: entry.fields.boolean,
    json: entry.fields.json,
  },
} as unknown as Entry;

export const newEntryReferenceTransformed: Entry = patchField(
  newEntryReference,
  'headline',
  newEntryReference.fields.headline
);

export const newAssetReferenceTransformed = patchField(
  patchField(newAssetReference, 'title', newAssetReference.fields.title),
  'file',
  newAssetReference.fields.file
);

export const unresolvedRichTextLinks = {
  nodeType: 'document',
  content: [
    {
      nodeType: 'embedded-entry-block',
      data: {
        target: {
          sys: {
            id: newEntryReference.sys.id,
            type: 'Link',
            linkType: 'Entry',
          },
        },
      },
      content: [],
    },
    // inline embedded entry
    {
      nodeType: 'paragraph',
      data: {},
      content: [
        {
          nodeType: 'embedded-entry-inline',
          data: {
            target: {
              sys: {
                id: newEntryReference.sys.id,
                type: 'Link',
                linkType: 'Entry',
              },
            },
          },
          content: [],
        },
      ],
    },
    // embedded asset block
    {
      nodeType: 'embedded-asset-block',
      data: {
        target: {
          sys: {
            id: newAssetReference.sys.id,
            type: 'Link',
            linkType: 'Asset',
          },
        },
      },
      content: [],
    },
    // entry-hyperlink
    {
      nodeType: 'paragraph',
      data: {},
      content: [
        {
          nodeType: 'entry-hyperlink',
          data: {
            target: {
              sys: {
                id: newEntryReference.sys.id,
                type: 'Link',
                linkType: 'Entry',
              },
            },
          },
          content: [{ nodeType: 'text', value: 'entry hyperlink', data: {}, marks: [] }],
        },
      ],
    },
    // asset-hyperlink
    {
      nodeType: 'paragraph',
      data: {},
      content: [
        {
          nodeType: 'asset-hyperlink',
          data: {
            target: {
              sys: {
                id: newAssetReference.sys.id,
                type: 'Link',
                linkType: 'Asset',
              },
            },
          },
          content: [{ nodeType: 'text', value: 'asset hyperlink', data: {}, marks: [] }],
        },
      ],
    },
  ],
  data: {},
};

export const resolvedRichTextLinks = {
  nodeType: 'document',
  content: [
    // embedded entry block
    {
      nodeType: 'embedded-entry-block',
      data: {
        target: { ...newEntryReferenceTransformed },
      },
      content: [],
    },
    // inline embedded entry
    {
      nodeType: 'paragraph',
      data: {},
      content: [
        {
          nodeType: 'embedded-entry-inline',
          data: {
            target: { ...newEntryReferenceTransformed },
          },
          content: [],
        },
      ],
    },
    // embedded asset block
    {
      nodeType: 'embedded-asset-block',
      data: {
        target: {
          ...newAssetReferenceTransformed,
        },
      },
      content: [],
    },
    // entry-hyperlink
    {
      nodeType: 'paragraph',
      data: {},
      content: [
        {
          nodeType: 'entry-hyperlink',
          data: { target: { ...newEntryReferenceTransformed } },
          content: [{ nodeType: 'text', value: 'entry hyperlink', data: {}, marks: [] }],
        },
      ],
    },
    // asset-hyperlink
    {
      nodeType: 'paragraph',
      data: {},
      content: [
        {
          nodeType: 'asset-hyperlink',
          data: { target: { ...newAssetReferenceTransformed } },
          content: [{ nodeType: 'text', value: 'asset hyperlink', data: {}, marks: [] }],
        },
      ],
    },
  ],
  data: {},
} as unknown as Document;
