import type { AssetProps } from 'contentful-management';
import { describe, it, expect } from 'vitest';

import assetFromEntryEditor from '../../__tests__/fixtures/assetFromEntryEditor.json';
import { updateAsset } from '../assets';
import assetFromPreviewApp from './fixtures/assetFromPreviewApp.json';

describe('Update GraphQL Assets', () => {
  const locale = 'en-US';

  it('merges the data together and resolves the nested information', () => {
    const result = updateAsset(
      assetFromPreviewApp,
      assetFromEntryEditor as unknown as AssetProps,
      locale
    );

    expect(result).toEqual({
      ...assetFromPreviewApp,
      title: assetFromEntryEditor.fields.title[locale],
      description: assetFromEntryEditor.fields.description[locale],
      url: `https:${assetFromEntryEditor.fields.file[locale].url}`,
      width: assetFromEntryEditor.fields.file[locale].details.image.width,
      height: assetFromEntryEditor.fields.file[locale].details.image.height,
    });
  });
});
