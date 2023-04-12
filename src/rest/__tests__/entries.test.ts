import type { AssetProps, ContentTypeProps, EntryProps } from 'contentful-management';
import { describe, it, expect } from 'vitest';

import contentTypeAsset from '../../__tests__/fixtures/contentTypeAsset.json';
import { clone } from '../../helpers';
import { updateEntity } from '../entries';
import contentTypeEntry from './fixtures/contentType.json';
import dataFromPreviewApp from './fixtures/dataFromPreviewApp.json';
import asset from './fixtures/updateAssetFromEntryEditor.json';
import entry from './fixtures/updateFromEntryEditor.json';

const EN = 'en-US';

describe('Update REST entry', () => {
  const updateFn = ({
    contentType = contentTypeEntry,
    dataFromPreviewApp,
    updateFromEntryEditor = entry,
    locale = EN,
  }: {
    contentType?: ContentTypeProps;
    dataFromPreviewApp: EntryProps;
    updateFromEntryEditor?: EntryProps | AssetProps;
    locale?: string;
  }) => {
    return updateEntity(contentType, clone(dataFromPreviewApp), updateFromEntryEditor, locale);
  };

  it('updates primitive fields', () => {
    expect(updateFn({ dataFromPreviewApp })).toEqual({
      ...dataFromPreviewApp,
      fields: {
        ...dataFromPreviewApp.fields,
        shortText: entry.fields.shortText[EN],
        shortTextUrl: entry.fields.shortTextUrl[EN],
        shortTextSlug: entry.fields.shortTextSlug[EN],
        longText: entry.fields.longText[EN],
        richText: entry.fields.richText[EN],
        numberInteger: entry.fields.numberInteger[EN],
        numberDecimal: entry.fields.numberDecimal[EN],
        dateTime: entry.fields.dateTime[EN],
        location: entry.fields.location[EN],
        boolean: entry.fields.boolean[EN],
        json: entry.fields.json[EN],
      },
    });
  });

  it('updates primitive fields for assets', () => {
    const assetFromPreviewApp = dataFromPreviewApp.fields.mediaOneFile as unknown as EntryProps;

    const result = updateFn({
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
});
