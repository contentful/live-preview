import { describe, it, expect } from 'vitest';
import { ContentfulLivePreview } from '../index';

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
      'data-contentful-field-id': fieldId,
      'data-contentful-entry-id': entryId,
      'data-contentful-locale': locale,
    });
  });
});
