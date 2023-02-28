import { describe, it, expect, vi } from 'vitest';

import { getLivePreviewProps } from './getLivePreviewProps';

describe('getLivePreviewProps', () => {
  it('returns the expected props with a given entryId, fieldId and locale', () => {
    const entryId = 'test-entry-id';
    const fieldId = 'test-field-id';
    const locale = 'test-locale';

    const result = getLivePreviewProps({
      entryId,
      fieldId,
      locale,
    });
    expect(result).toStrictEqual({
      'data-contentful-field-id': fieldId,
      'data-contentful-entry-id': entryId,
      'data-contentful-locale': locale,
      onClick: vi.spyOn(result, 'onClick'),
    });
  });
});
