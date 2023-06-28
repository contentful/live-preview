import type { AssetProps, ContentTypeProps, EntryProps } from 'contentful-management';
import { describe, it, expect, vi, afterEach, beforeEach, Mock } from 'vitest';

import contentTypeAsset from '../../__tests__/fixtures/contentTypeAsset.json';
import { clone, resolveReference } from '../../helpers';
import { EntityReferenceMap } from '../../types';
import { updateEntity } from '../entities';
import contentTypeEntry from './fixtures/contentType.json';
import dataFromPreviewApp from './fixtures/dataFromPreviewApp.json';
import asset from './fixtures/updateAssetFromEntryEditor.json';
import entry from './fixtures/updateFromEntryEditor.json';

const EN = 'en-US';
const referenceWithRichTextId = 'referenceWithRichTextId';

function patchField<T extends EntryProps | AssetProps>(
  originalData: T,
  name: keyof T['fields'],
  value: unknown
) {
  return {
    ...originalData,
    fields: {
      ...originalData.fields,
      [name]: value,
    },
  };
}

vi.mock('../../helpers/resolveReference');

describe('Update REST entry', () => {
  const newEntryReference = {
    sys: { id: 'new-entry-id' },
    fields: {
      headline: { [EN]: 'Hello' },
    },
  } as unknown as EntryProps;

  const newAssetReference = {
    sys: { id: 'new-asset-id', linkType: 'Asset' },
    fields: {
      title: { [EN]: 'New Asset' },
      file: { [EN]: { url: 'https://app.contentful.com/newAsset.png' } },
    },
  } as unknown as AssetProps;

  const unresolvedRichTextLinks = {
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

  const defaultEntityReferenceMap = new Map<string, EntryProps | AssetProps>([
    [newEntryReference.sys.id, newEntryReference],
    [newAssetReference.sys.id, newAssetReference],
    [
      referenceWithRichTextId,
      {
        sys: { id: referenceWithRichTextId },
        fields: {
          richTextFieldName: {
            [EN]: unresolvedRichTextLinks,
          },
        },
      } as unknown as EntryProps,
    ],
  ]);

  const defaultResult = {
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

  const newEntryReferenceTransformed = patchField(
    newEntryReference,
    'headline',
    newEntryReference.fields.headline[EN]
  );
  const newAssetReferenceTransformed = patchField(
    patchField(newAssetReference, 'title', newAssetReference.fields.title[EN]),
    'file',
    newAssetReference.fields.file[EN]
  );

  const resolvedRichTextLinks = {
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

  beforeEach(() => {
    (resolveReference as Mock).mockImplementation(async ({ referenceId }) => {
      return { reference: defaultEntityReferenceMap.get(referenceId) };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const updateFn = async ({
    contentType = contentTypeEntry,
    dataFromPreviewApp,
    updateFromEntryEditor = entry,
    locale = EN,
    entityReferenceMap = defaultEntityReferenceMap,
  }: {
    contentType?: ContentTypeProps;
    dataFromPreviewApp: EntryProps;
    updateFromEntryEditor?: EntryProps | AssetProps;
    locale?: string;
    entityReferenceMap?: EntityReferenceMap;
  }) => {
    return updateEntity(
      contentType,
      clone(dataFromPreviewApp),
      clone(updateFromEntryEditor),
      locale,
      entityReferenceMap
    );
  };

  it('updates primitive fields', async () => {
    const result = await updateFn({ dataFromPreviewApp });
    expect(result).toEqual(defaultResult);
  });

  it('updates primitive fields for assets', async () => {
    const assetFromPreviewApp = dataFromPreviewApp.fields.mediaOneFile as unknown as EntryProps;

    const result = await updateFn({
      contentType: contentTypeAsset,
      dataFromPreviewApp: assetFromPreviewApp,
      updateFromEntryEditor: asset,
    });

    expect(result).toEqual({
      ...assetFromPreviewApp,
      fields: {
        ...assetFromPreviewApp.fields,
        title: asset.fields.title[EN],
        description: asset.fields.description[EN],
        file: asset.fields.file[EN],
      },
    });
  });

  describe('references', () => {
    it('removes a single reference', async () => {
      const result = await updateFn({
        dataFromPreviewApp,
        updateFromEntryEditor: patchField(entry, 'refOneSameSpace', undefined),
      });

      expect(result).toEqual(patchField(defaultResult, 'refOneSameSpace', undefined));
    });

    it('adds a single reference', async () => {
      const result = await updateFn({
        dataFromPreviewApp: patchField(dataFromPreviewApp, 'refOneSameSpace', undefined),
        updateFromEntryEditor: patchField(entry, 'refOneSameSpace', {
          [EN]: { sys: newEntryReference.sys },
        }),
      });

      expect(result).toEqual(
        patchField(defaultResult, 'refOneSameSpace', newEntryReferenceTransformed)
      );
    });

    it('adds multi references', async () => {
      const result = await updateFn({
        dataFromPreviewApp: patchField(dataFromPreviewApp, 'refManySameSpace', undefined),
        updateFromEntryEditor: patchField(entry, 'refManySameSpace', {
          [EN]: [{ sys: newEntryReference.sys }, { sys: newAssetReference.sys }],
        }),
      });

      expect(result).toEqual(
        patchField(defaultResult, 'refManySameSpace', [
          newEntryReferenceTransformed,
          newAssetReferenceTransformed,
        ])
      );
    });

    it('re-orders multi references', async () => {
      const result = await updateFn({
        dataFromPreviewApp: patchField(defaultResult, 'refManySameSpace', [
          newEntryReferenceTransformed,
          newAssetReferenceTransformed,
        ]),
        updateFromEntryEditor: patchField(entry, 'refManySameSpace', {
          [EN]: [{ sys: newAssetReference.sys }, { sys: newEntryReference.sys }],
        }),
      });

      expect(result).toEqual(
        patchField(defaultResult, 'refManySameSpace', [
          newAssetReferenceTransformed,
          newEntryReferenceTransformed,
        ])
      );
    });

    it('removes a reference from multi references', async () => {
      const result = await updateFn({
        dataFromPreviewApp: patchField(defaultResult, 'refManySameSpace', [
          newEntryReferenceTransformed,
          newAssetReferenceTransformed,
        ]),
        updateFromEntryEditor: patchField(entry, 'refManySameSpace', {
          [EN]: [{ sys: newEntryReference.sys }],
        }),
      });

      expect(result).toEqual(
        patchField(defaultResult, 'refManySameSpace', [newEntryReferenceTransformed])
      );
    });

    it('removes the last reference from multi references', async () => {
      const result = await updateFn({
        dataFromPreviewApp: patchField(defaultResult, 'refManySameSpace', [
          newAssetReferenceTransformed,
        ]),
        updateFromEntryEditor: patchField(entry, 'refManySameSpace', undefined),
      });

      expect(result).toEqual(patchField(defaultResult, 'refManySameSpace', undefined));
    });

    it('resolves reference with rich text with embedded references', async () => {
      const result = await updateFn({
        dataFromPreviewApp: patchField(defaultResult, 'refOneSameSpace', undefined),
        updateFromEntryEditor: patchField(entry, 'refOneSameSpace', {
          [EN]: { sys: { id: referenceWithRichTextId } },
        }),
      });
      expect(result.fields.refOneSameSpace.fields.richTextFieldName).toEqual(resolvedRichTextLinks);
    });
  });
});
