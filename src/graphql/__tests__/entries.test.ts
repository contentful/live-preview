import type { EntryProps, KeyValueMap } from 'contentful-management/types';
import { describe, it, expect, vi, afterEach, beforeEach, Mock } from 'vitest';

import * as Utils from '../../helpers';
import { resolveReference } from '../../helpers/resolveReference';
import { SysProps, EntityReferenceMap, Entity, ContentType } from '../../types';
import { updateEntry } from '../entries';
import defaultContentType from './fixtures/contentType.json';
import entry from './fixtures/entry.json';

const EN = 'en-US';

vi.mock('../../helpers/debug');
vi.mock('../../helpers/resolveReference');

describe('Update GraphQL Entry', () => {
  const testReferenceId = '18kDTlnJNnDIJf6PsXE5Mr';

  beforeEach(() => {
    (resolveReference as Mock).mockResolvedValue({
      reference: {
        sys: {
          contentType: {
            sys: {
              id: testReferenceId,
              linkType: 'Entry',
            },
          },
        },
      },
      typeName: 'TestContentType',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const updateFn = ({
    data,
    update = entry as EntryProps,
    locale = EN,
    entityReferenceMap = new EntityReferenceMap(),
    contentType = defaultContentType,
  }: {
    data: Entity & { sys: SysProps };
    update?: EntryProps;
    locale?: string;
    entityReferenceMap?: EntityReferenceMap;
    contentType?: ContentType;
  }) => {
    return updateEntry({
      contentType,
      dataFromPreviewApp: data,
      updateFromEntryEditor: update,
      locale,
      entityReferenceMap,
    });
  };

  it('keeps __typename unchanged', async () => {
    const data = { __typename: 'CT', shortText: 'text', sys: { id: 'abc' } };

    const update = await updateFn({ data });

    expect(update).toEqual(
      expect.objectContaining({
        __typename: 'CT',
      })
    );
    expect(Utils.debug.warn).not.toHaveBeenCalled();
  });

  it('warns but keeps unknown fields', async () => {
    const data = { unknownField: 'text', sys: { id: entry.sys.id } };

    const update = await updateFn({ data });

    expect(update).toEqual(data);
    expect(Utils.debug.warn).toHaveBeenCalledWith(
      expect.stringMatching(/Unrecognized field 'unknownField'/)
    );
  });

  it('updates primitive fields', async () => {
    const data = {
      shortText: 'oldValue',
      shortTextList: ['oldValue'],
      longText: 'oldValue',
      boolean: false,
      numberInteger: -1,
      numberDecimal: -1.0,
      dateTime: '1970-1-1T00:00+00:00',
      location: {
        lon: 0,
        lat: 0,
      },
      json: {
        test: 'oldValue',
      },
      sys: {
        id: entry.sys.id,
      },
    };

    const result = await updateFn({ data });

    expect(result).toEqual({
      shortText: entry.fields.shortText[EN],
      shortTextList: entry.fields.shortTextList[EN],
      longText: entry.fields.longText[EN],
      boolean: entry.fields.boolean[EN],
      numberInteger: entry.fields.numberInteger[EN],
      numberDecimal: entry.fields.numberDecimal[EN],
      dateTime: entry.fields.dateTime[EN],
      location: entry.fields.location[EN],
      json: entry.fields.json[EN],
      sys: {
        id: entry.sys.id,
      },
    });
  });

  describe('single reference fields', () => {
    describe('entry', () => {
      it('resolves unknown references', async () => {
        const data = {
          __typename: 'Page',
          sys: {
            id: entry.sys.id,
          },
          reference: null,
        };
        const update = {
          sys: {
            id: entry.sys.id,
          },
          fields: {
            reference: {
              'en-US': {
                sys: {
                  type: 'Link',
                  linkType: 'Entry',
                  id: testReferenceId,
                },
              },
            },
          },
        } as unknown as EntryProps<KeyValueMap>;

        const result = await updateFn({ data, update });

        expect(result).toEqual({
          __typename: 'Page',
          sys: {
            id: entry.sys.id,
          },
          reference: {
            __typename: 'TestContentType',
            sys: {
              id: testReferenceId,
              linkType: 'Entry',
              type: 'Link',
            },
          },
        });
      });

      it('if reference is not in entityReferenceMap but has a __typename it does not call resolveReference', async () => {
        const data = {
          __typename: 'Page',
          sys: {
            id: entry.sys.id,
          },
          reference: null,
        };
        const testAddingEntryId = '18kDTlnJNnDIJf6PsXE5Mr';
        const update = {
          sys: {
            id: entry.sys.id,
          },
          fields: {
            reference: {
              'en-US': {
                __typename: 'TestContentType',
                sys: {
                  type: 'Link',
                  linkType: 'Entry',
                  id: testAddingEntryId,
                },
              },
            },
          },
        } as unknown as EntryProps<KeyValueMap>;

        const result = await updateFn({ data, update });

        expect(result).toEqual({
          __typename: 'Page',
          sys: {
            id: entry.sys.id,
          },
          reference: {
            __typename: 'TestContentType',
            sys: {
              id: testAddingEntryId,
              linkType: 'Entry',
              type: 'Link',
            },
          },
        });

        expect(resolveReference).not.toHaveBeenCalled();
      });

      it('graphql properties are not lost with updates', async () => {
        const data = {
          __typename: 'Page',
          sys: {
            id: entry.sys.id,
          },
          reference: {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: testReferenceId,
            },
            propertyShouldStay: 'value',
          },
        };
        const update = {
          sys: {
            id: entry.sys.id,
          },
          fields: {
            reference: {
              'en-US': {
                sys: {
                  type: 'Link',
                  linkType: 'Entry',
                  id: testReferenceId,
                },
              },
            },
          },
        } as unknown as EntryProps<KeyValueMap>;

        const result = await updateFn({ data, update });

        expect(result).toEqual({
          __typename: 'Page',
          sys: {
            id: entry.sys.id,
          },
          reference: {
            // content type has been adjusted to have capital letter at the start
            __typename: 'TestContentType',
            sys: {
              id: testReferenceId,
              linkType: 'Entry',
              type: 'Link',
            },
            propertyShouldStay: 'value',
          },
        });
      });
    });

    describe('asset', () => {
      it('resolves unknown references', async () => {
        const data = {
          __typename: 'Page',
          sys: { id: '1' },
          hero: undefined,
        };

        const update = {
          sys: {
            id: '1',
          },
          fields: {
            hero: {
              [EN]: { sys: { id: '1', linkType: 'Asset', type: 'Link' } },
            },
          },
        } as unknown as EntryProps<KeyValueMap>;

        const contentType = {
          sys: { id: 'string' },
          fields: [{ apiName: 'hero', type: 'Link' }],
        } as unknown as ContentType;

        (resolveReference as Mock).mockResolvedValue({
          reference: {
            sys: {
              contentType: {
                sys: {
                  id: '1',
                  linkType: 'Asset',
                },
              },
            },
          },
          typeName: 'Asset',
        });

        const result = await updateFn({ data, update, contentType });

        expect(result).toEqual({
          ...data,
          hero: {
            __typename: 'Asset',
            sys: {
              id: '1',
              linkType: 'Asset',
              type: 'Link',
            },
          },
        });
      });
    });
  });

  describe('multi reference fields', () => {
    it('resolves unknown references correctly', async () => {
      const data = {
        __typename: 'Page',
        sys: {
          id: entry.sys.id,
        },
        referenceManyCollection: {
          items: [],
        },
      };
      const testAddingEntryId = '3JqLncpMbnZYrCPebujXhK';
      const testContentTypeId = 'testContentTypeForManyRef';
      const update = {
        sys: {
          id: entry.sys.id,
        },
        fields: {
          referenceMany: {
            'en-US': [
              {
                sys: {
                  type: 'Link',
                  linkType: 'Entry',
                  id: testAddingEntryId,
                },
              },
            ],
          },
        },
      } as unknown as EntryProps<KeyValueMap>;

      (resolveReference as Mock).mockResolvedValue({
        reference: {
          sys: {
            contentType: {
              sys: {
                id: testContentTypeId,
                type: 'TestContentTypeForManyRef',
                linkType: 'Entry',
              },
            },
          },
        },
        typeName: 'TestContentTypeForManyRef',
      });

      const result = await updateFn({ data, update });

      expect(result).toEqual({
        __typename: 'Page',
        sys: {
          id: entry.sys.id,
        },
        referenceManyCollection: {
          items: [
            {
              __typename: 'TestContentTypeForManyRef',
              sys: {
                id: testAddingEntryId,
                linkType: 'Entry',
                type: 'Link',
              },
            },
          ],
        },
      });
    });

    it('if reference is not in entityReferenceMap but has a __typename it does not call resolveReference', async () => {
      const data = {
        __typename: 'Page',
        sys: {
          id: entry.sys.id,
        },
        referenceManyCollection: {
          items: [],
        },
      };
      const testAddingEntryId = '3JqLncpMbnZYrCPebujXhK';
      const update = {
        sys: {
          id: entry.sys.id,
        },
        fields: {
          referenceMany: {
            'en-US': [
              {
                __typename: 'TestContentTypeForManyRef',
                sys: {
                  type: 'Link',
                  linkType: 'Entry',
                  id: testAddingEntryId,
                },
              },
            ],
          },
        },
      } as unknown as EntryProps<KeyValueMap>;

      const result = await updateFn({ data, update });

      expect(result).toEqual({
        __typename: 'Page',
        sys: {
          id: entry.sys.id,
        },
        referenceManyCollection: {
          items: [
            {
              __typename: 'TestContentTypeForManyRef',
              sys: {
                id: testAddingEntryId,
                linkType: 'Entry',
                type: 'Link',
              },
            },
          ],
        },
      });

      expect(resolveReference).not.toHaveBeenCalled();
    });

    it('graphql properties are not lost with updates', async () => {
      const testAddingEntryId = '3JqLncpMbnZYrCPebujXhK';
      const data = {
        __typename: 'Page',
        sys: {
          id: entry.sys.id,
        },
        referenceManyCollection: {
          items: [
            {
              __typename: 'TestContentTypeForManyRef',
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: testAddingEntryId,
              },
              propertyShouldStay: 'value',
            },
          ],
        },
      };

      const update = {
        sys: {
          id: entry.sys.id,
        },
        fields: {
          referenceMany: {
            'en-US': [
              {
                __typename: 'TestContentTypeForManyRef',
                sys: {
                  type: 'Link',
                  linkType: 'Entry',
                  id: testAddingEntryId,
                },
              },
            ],
          },
        },
      } as unknown as EntryProps<KeyValueMap>;

      const result = await updateFn({ data, update });

      expect(result).toEqual({
        __typename: 'Page',
        sys: {
          id: entry.sys.id,
        },
        referenceManyCollection: {
          items: [
            {
              __typename: 'TestContentTypeForManyRef',
              sys: {
                id: testAddingEntryId,
                linkType: 'Entry',
                type: 'Link',
              },
              propertyShouldStay: 'value',
            },
          ],
        },
      });
    });
  });

  it('falls back to null for empty fields', async () => {
    const data = {
      shortText: 'oldValue',
      sys: {
        id: entry.sys.id,
      },
    };

    const result = await updateFn({ data, locale: 'n/a' });

    expect(result).toEqual({
      shortText: null,
      sys: {
        id: entry.sys.id,
      },
    });
  });

  describe('nested references', () => {
    it('can be updated correctly', async () => {
      const data = {
        sys: { id: '1' },
        menuCollection: { items: [] },
        __typename: 'Footer',
      };

      const update = {
        sys: { id: '1' },
        fields: {
          menu: {
            [EN]: [
              {
                sys: { id: '2' },
              },
            ],
          },
        },
      } as unknown as EntryProps<KeyValueMap>;

      const contentType = {
        sys: { id: '1' },
        fields: [{ apiName: 'menu', type: 'Array', items: { type: 'Link', linkType: 'Entry' } }],
      } as ContentType;

      (resolveReference as Mock).mockResolvedValue({
        reference: {
          sys: {
            id: '2',
            contentType: {
              sys: {
                id: '2',
                type: 'Link',
                linkType: 'Entry',
              },
            },
          },
          fields: {
            title: {
              [EN]: 'Hello World',
            },
          },
        },
        typeName: '2',
      });

      const result = await updateFn({ data, update, contentType });

      expect(result).toEqual({
        __typename: 'Footer',
        menuCollection: {
          items: [
            {
              __typename: '2',
              sys: {
                id: '2',
              },
              title: 'Hello World',
            },
          ],
        },
        sys: {
          id: '1',
        },
      });
    });
  });
});
