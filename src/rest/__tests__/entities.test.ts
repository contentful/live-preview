import type { AssetProps, ContentTypeProps, EntryProps } from 'contentful-management';
import { describe, it, expect, vi, afterEach, beforeEach, Mock } from 'vitest';

import contentTypeAsset from '../../__tests__/fixtures/contentTypeAsset.json';
import { clone, resolveReference } from '../../helpers';
import { EntityReferenceMap } from '../../types';
import { updateEntity } from '../entities';
import { EN, referenceWithRichTextId } from './constants';
import contentTypeEntry from './fixtures/contentType.json';
import {
  defaultResult,
  newAssetReference,
  newAssetReferenceTransformed,
  newEntryReference,
  newEntryReferenceTransformed,
  resolvedRichTextLinks,
  unresolvedRichTextLinks,
} from './fixtures/data';
import dataFromPreviewApp from './fixtures/dataFromPreviewApp.json';
import asset from './fixtures/updateAssetFromEntryEditor.json';
import entry from './fixtures/updateFromEntryEditor.json';
import { patchField } from './utils';

vi.mock('../../helpers/resolveReference');

describe('Update REST entry', () => {
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

    it('resolves reference for rich text with embedded references', async () => {
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
