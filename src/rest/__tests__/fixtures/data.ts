import type { AssetProps, EntryProps } from 'contentful-management';

import { EN } from '../constants';
import { patchField } from '../utils';
import dataFromPreviewApp from './dataFromPreviewApp.json';
import entry from './updateFromEntryEditor.json';

export const newEntryReference = {
  sys: { id: 'new-entry-id' },
  fields: {
    headline: { [EN]: 'Hello' },
  },
} as unknown as EntryProps;

export const newAssetReference = {
  sys: { id: 'new-asset-id', linkType: 'Asset' },
  fields: {
    title: { [EN]: 'New Asset' },
    file: { [EN]: { url: 'https://app.contentful.com/newAsset.png' } },
  },
} as unknown as AssetProps;

export const defaultResult = {
  ...dataFromPreviewApp,
  fields: {
    ...dataFromPreviewApp.fields,
    // updated data:
    shortText: entry.fields.shortText[EN],
    shortTextUrl: entry.fields.shortTextUrl[EN],
    shortTextSlug: entry.fields.shortTextSlug[EN],
    longTextMultiple: entry.fields.longTextMultiple[EN],
    richText: entry.fields.richText[EN],
    numberInteger: entry.fields.numberInteger[EN],
    numberDecimal: entry.fields.numberDecimal[EN],
    dateTime: entry.fields.dateTime[EN],
    location: entry.fields.location[EN],
    boolean: entry.fields.boolean[EN],
    json: entry.fields.json[EN],
  },
};

export const newEntryReferenceTransformed = patchField(
  newEntryReference,
  'headline',
  newEntryReference.fields.headline[EN]
);

export const newAssetReferenceTransformed = patchField(
  patchField(newAssetReference, 'title', newAssetReference.fields.title[EN]),
  'file',
  newAssetReference.fields.file[EN]
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
};
