import type { Asset, Entry } from 'contentful';
import type { ContentTypeProps } from 'contentful-management';
import { describe, it, expect, vi, afterEach, beforeEach, Mock } from 'vitest';

import contentTypeAsset from '../../__tests__/fixtures/contentTypeAsset.json';
import { MAX_DEPTH } from '../../constants';
import { clone, resolveReference } from '../../helpers';
import { Reference, updateEntity } from '../entities';
import { EN, referenceWithRichTextId } from './constants';
import contentTypeEntryJSON from './fixtures/contentType.json';
import {
  defaultResult,
  newAssetReference,
  newAssetReferenceTransformed,
  newEntryReference,
  newEntryReferenceTransformed,
  resolvedRichTextLinks,
  unresolvedRichTextLinks,
} from './fixtures/data';
import dataFromPreviewAppJSON from './fixtures/dataFromPreviewApp.json';
import assetJSON from './fixtures/updateAssetFromEntryEditor.json';
import entryJSON from './fixtures/updateFromEntryEditor.json';
import { patchField } from './utils';
import { GetStore } from '../../types';

vi.mock('../../helpers/resolveReference');

const contentTypeEntry = contentTypeEntryJSON as ContentTypeProps;
const entry = entryJSON as unknown as Entry;
const asset = assetJSON as unknown as Asset;
const dataFromPreviewApp = dataFromPreviewAppJSON as unknown as Entry;

describe('Update REST entry', () => {
  const getStore = vi.fn<Parameters<GetStore>, ReturnType<GetStore>>();
  const defaultEntities: Reference[] = [
    newEntryReference,
    newAssetReference,
    {
      sys: { id: referenceWithRichTextId },
      fields: {
        richTextFieldName: unresolvedRichTextLinks,
      },
    } as unknown as Entry,
  ];

  beforeEach(() => {
    (resolveReference as Mock).mockImplementation(async ({ referenceId }) => {
      return { reference: defaultEntities.find((e) => e.sys.id === referenceId) };
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
  }: {
    contentType?: ContentTypeProps;
    dataFromPreviewApp: Entry;
    updateFromEntryEditor?: Entry | Asset;
    locale?: string;
  }) =>
    updateEntity(
      contentType,
      clone(dataFromPreviewApp),
      clone(updateFromEntryEditor),
      locale,
      0,
      getStore
    );

  it('updates primitive fields', async () => {
    const result = await updateFn({ dataFromPreviewApp });
    expect(result).toEqual(defaultResult);
  });

  it('updates primitive fields for assets', async () => {
    const assetFromPreviewApp = dataFromPreviewApp.fields.mediaOneFile as unknown as Entry;

    const result = await updateFn({
      contentType: contentTypeAsset,
      dataFromPreviewApp: assetFromPreviewApp,
      updateFromEntryEditor: asset,
    });

    expect(result).toEqual({
      ...assetFromPreviewApp,
      fields: {
        ...assetFromPreviewApp.fields,
        title: asset.fields.title,
        description: asset.fields.description,
        file: asset.fields.file,
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
        updateFromEntryEditor: patchField(entry, 'refOneSameSpace', { sys: newEntryReference.sys }),
      });

      expect(result).toEqual(
        patchField(defaultResult, 'refOneSameSpace', newEntryReferenceTransformed)
      );
    });

    it('adds multi references', async () => {
      const result = await updateFn({
        dataFromPreviewApp: patchField(dataFromPreviewApp, 'refManySameSpace', undefined),
        updateFromEntryEditor: patchField(entry, 'refManySameSpace', [
          { sys: newEntryReference.sys },
          { sys: newAssetReference.sys },
        ]),
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
        updateFromEntryEditor: patchField(entry, 'refManySameSpace', [
          { sys: newAssetReference.sys },
          { sys: newEntryReference.sys },
        ]),
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
        updateFromEntryEditor: patchField(entry, 'refManySameSpace', [
          { sys: newEntryReference.sys },
        ]),
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
          sys: { id: referenceWithRichTextId },
        }),
      });

      expect(
        (result.fields.refOneSameSpace as Entry | undefined)?.fields?.richTextFieldName
      ).toEqual(resolvedRichTextLinks);
    });
  });

  describe('Circular references', () => {
    it('does not resolve references deeper than MAX_DEPTH', async () => {
      // Create circular reference
      const circularReferenceId = 'circularReferenceId';
      const circularReference = {
        sys: { id: circularReferenceId },
        fields: {
          reference: { sys: { id: circularReferenceId, linkType: 'Entry', type: 'Link' } },
        },
      } as unknown as Entry;

      (resolveReference as Mock).mockImplementation(async ({ referenceId }) => {
        return {
          reference: [...defaultEntities, circularReference].find((e) => e.sys.id === referenceId),
        };
      });

      // Update entry to contain the circular reference
      const result = await updateFn({
        dataFromPreviewApp,
        updateFromEntryEditor: patchField(entry, 'refOneSameSpace', { sys: circularReference.sys }),
      });

      // Assert that the recursion stops at a certain depth
      let depthCounter = 0;
      let currentReference = result.fields.refOneSameSpace as Entry | undefined;
      while (currentReference && currentReference.fields && currentReference.fields.reference) {
        currentReference = currentReference.fields.reference as Entry | undefined;
        depthCounter += 1;
      }

      expect(depthCounter).toBeLessThan(MAX_DEPTH);
    });
  });
});
