import type { Entry } from 'contentful';
import type { ContentTypeProps } from 'contentful-management/types';
import { describe, it, expect, vi, afterEach, beforeEach, Mock } from 'vitest';

import * as Utils from '../../helpers';
import { resolveReference } from '../../helpers/resolveReference';
import type { SysProps, Entity, ContentType, GetStore } from '../../types';
import { updateEntry } from '../entries';
import defaultContentTypeJSON from './fixtures/contentType.json';
import entry from './fixtures/entry.json';

const EN = 'en-US';

vi.mock('../../helpers/debug');
vi.mock('../../helpers/resolveReference');

const defaultContentType = defaultContentTypeJSON as ContentTypeProps;

// Note: we can get rid of expect.objectContaining, if we iterate over the provided data instead of the ContentType.fields
describe('Update GraphQL Entry', () => {
  const testReferenceId = '18kDTlnJNnDIJf6PsXE5Mr';
  const getStore = vi.fn<Parameters<GetStore>, ReturnType<GetStore>>();

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
    update = entry as unknown as Entry,
    locale = EN,
    contentType = defaultContentType,
  }: {
    data: Entity & { sys: SysProps };
    update?: Entry;
    locale?: string;
    contentType?: ContentType;
  }) => {
    return updateEntry({
      contentType,
      dataFromPreviewApp: data,
      updateFromEntryEditor: update,
      locale,
      getStore,
      depth: 0,
    });
  };

  it('keeps __typename unchanged', async () => {
    const data = { __typename: 'CT', shortText: 'text', sys: { id: 'abc' } };

    const update = await updateFn({
      data,
      contentType: {
        sys: { id: 'abc' },
        fields: [{ name: 'shortText', type: 'Symbol' }],
      } as unknown as ContentType,
    });

    expect(update).toEqual(
      expect.objectContaining({
        __typename: 'CT',
      })
    );
    expect(Utils.debug.warn).not.toHaveBeenCalled();
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

    expect(result).toEqual(
      expect.objectContaining({
        shortText: entry.fields.shortText,
        shortTextList: entry.fields.shortTextList,
        longText: entry.fields.longText,
        boolean: entry.fields.boolean,
        numberInteger: entry.fields.numberInteger,
        numberDecimal: entry.fields.numberDecimal,
        dateTime: entry.fields.dateTime,
        location: entry.fields.location,
        json: entry.fields.json,
        sys: {
          id: entry.sys.id,
        },
      })
    );
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
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: testReferenceId,
              },
            },
          },
        } as unknown as Entry;

        const result = await updateFn({ data, update });

        expect(result).toEqual(
          expect.objectContaining({
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
          })
        );
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
              __typename: 'TestContentType',
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: testAddingEntryId,
              },
            },
          },
        } as unknown as Entry;

        const result = await updateFn({ data, update });

        expect(result).toEqual(
          expect.objectContaining({
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
          })
        );

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
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: testReferenceId,
              },
            },
          },
        } as unknown as Entry;

        const result = await updateFn({ data, update });

        expect(result).toEqual(
          expect.objectContaining({
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
          })
        );
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
            hero: { sys: { id: '1', linkType: 'Asset', type: 'Link' } },
          },
        } as unknown as Entry;

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
          referenceMany: [
            {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: testAddingEntryId,
              },
            },
          ],
        },
      } as unknown as Entry;

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

      expect(result).toEqual(
        expect.objectContaining({
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
        })
      );
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
          referenceMany: [
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
      } as unknown as Entry;

      const result = await updateFn({ data, update });

      expect(result).toEqual(
        expect.objectContaining({
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
        })
      );

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
          referenceMany: [
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
      } as unknown as Entry;

      const result = await updateFn({
        data,
        update,
      });

      expect(result).toEqual(
        expect.objectContaining({
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
        })
      );
    });
  });

  it('falls back to null for empty fields', async () => {
    const data = {
      shortText: 'oldValue',
      sys: {
        id: entry.sys.id,
      },
    };

    const result = await updateFn({
      data,
      locale: 'n/a',
      contentType: {
        sys: defaultContentType.sys,
        fields: [{ name: 'shortText', type: 'Symbol' }],
      } as unknown as ContentType,
      update: {
        sys: {
          id: entry.sys.id,
        },
        fields: {
          shortText: undefined,
        },
      } as unknown as Entry,
    });

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
          menu: [
            {
              sys: { id: '2' },
            },
          ],
        },
      } as unknown as Entry;

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
            title: 'Hello World',
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
