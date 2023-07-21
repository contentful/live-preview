import type { Asset } from 'contentful';
import { describe, it, expect } from 'vitest';

import assetFromEntryEditor from '../../__tests__/fixtures/assetFromEntryEditor.json';
import { updateAsset } from '../assets';
import assetFromPreviewApp from './fixtures/assetFromPreviewApp.json';

describe('Update GraphQL Assets', () => {
  it('merges the data together and resolves the nested information', () => {
    const result = updateAsset(assetFromPreviewApp, assetFromEntryEditor as unknown as Asset);

    expect(result).toEqual({
      ...assetFromPreviewApp,
      title: assetFromEntryEditor.fields.title,
      description: assetFromEntryEditor.fields.description,
      url: `https:${assetFromEntryEditor.fields.file.url}`,
      width: assetFromEntryEditor.fields.file.details.image.width,
      height: assetFromEntryEditor.fields.file.details.image.height,
    });
  });
});
