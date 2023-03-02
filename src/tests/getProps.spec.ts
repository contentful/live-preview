import { describe, it, expect } from 'vitest';
import { ContentfulLivePreview } from '../index';
import { TagAttributes } from '../types';

describe('getProps', () => {
  it('returns the expected props with a given entryId, fieldId and locale', () => {
    const entryId = 'test-entry-id';
    const fieldId = 'test-field-id';
    const locale = 'test-locale';

    const result = ContentfulLivePreview.getProps({
      entryId,
      fieldId,
      locale,
    });

    expect(result).toStrictEqual({
      [TagAttributes.FIELD_ID]: fieldId,
      [TagAttributes.ENTRY_ID]: entryId,
      [TagAttributes.LOCALE]: locale,
    });
  });
});
