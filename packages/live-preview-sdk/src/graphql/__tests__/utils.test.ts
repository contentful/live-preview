import { describe, expect, it } from 'vitest';

import { buildCollectionName } from '../utils';

describe('buildCollectionName', () => {
  it('builds the correct name for a GraphQL collection', () => {
    const result = buildCollectionName('topSection');

    expect(result).toEqual('topSectionCollection');
  });
});
