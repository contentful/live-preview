import { EntryProps, KeyValueMap } from 'contentful-management/types';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { SysProps, EntryReferenceMap, MessageAction } from '../../types';
import * as Utils from '../../utils';
import { updateEntry } from '../entries';
import contentType from './fixtures/contentType.json';
import entry from './fixtures/entry.json';

const EN = 'en-US';
// const DE = 'de';

describe('Update GraphQL Entry', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const updateFn = ({
    data,
    update = entry as EntryProps,
    locale = EN,
    entityReferenceMap = new EntryReferenceMap(),
  }: {
    data: Record<string, unknown> & { sys: SysProps };
    update?: EntryProps;
    locale?: string;
    entityReferenceMap?: EntryReferenceMap;
  }) => {
    return updateEntry(contentType, data, update, locale, entityReferenceMap);
  };

  it('keeps __typename unchanged', () => {
    const warn = vi.spyOn(console, 'warn');
    const data = { __typename: 'CT', shortText: 'text', sys: { id: 'abc' } };

    const update = updateFn({ data });

    expect(update).toEqual(
      expect.objectContaining({
        __typename: 'CT',
      })
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns but keeps unknown fields', () => {
    const data = { unknownField: 'text', sys: { id: entry.sys.id } };
    const warn = vi.spyOn(console, 'warn');

    const update = updateFn({ data });

    expect(update).toEqual(data);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/Unrecognized field 'unknownField'/));
  });

  it('updates primitive fields', () => {
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

    expect(updateFn({ data })).toEqual({
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
    it('calls sendMessageToEditor when entry being added is not in the entityReferenceMap', () => {
      const data = {
        __typename: 'Page',
        sys: {
          id: entry.sys.id,
        },
        reference: null,
      };
      const testAddingEntryId = '18kDTlnJNnDIJf6PsXE5Mr';
      const sendMessageToEditor = vi.spyOn(Utils, 'sendMessageToEditor').mockReturnThis();
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
                id: testAddingEntryId,
              },
            },
          },
        },
      } as unknown as EntryProps<KeyValueMap>;

      // value has not changed, just sends message back to editor
      expect(updateFn({ data, update })).toEqual({
        __typename: 'Page',
        sys: {
          id: entry.sys.id,
        },
        reference: null,
      });
      expect(sendMessageToEditor).toHaveBeenCalledWith(MessageAction.ENTITY_NOT_KNOWN, {
        referenceEntityId: '18kDTlnJNnDIJf6PsXE5Mr',
      });
    });

    it('generates a __typename when entry being added is in the entityReferenceMap then adds this to the modified return value', () => {
      const data = {
        __typename: 'Page',
        sys: {
          id: entry.sys.id,
        },
        reference: null,
      };
      const testAddingEntryId = '18kDTlnJNnDIJf6PsXE5Mr';
      const testContentTypeId = 'testContentType';
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
                id: testAddingEntryId,
              },
            },
          },
        },
      } as unknown as EntryProps<KeyValueMap>;

      const entityReferenceMap = new EntryReferenceMap();
      entityReferenceMap.set(testAddingEntryId, {
        sys: {
          contentType: {
            sys: {
              id: testContentTypeId,
              type: 'TestContentType',
              linkType: 'Entry',
            },
          },
        },
      } as EntryProps<KeyValueMap>);

      // value has not changed, just sends message back to editor
      expect(updateFn({ data, update, entityReferenceMap })).toEqual({
        __typename: 'Page',
        sys: {
          id: entry.sys.id,
        },
        reference: {
          // content type has been adjusted to have capital letter at the start
          __typename: 'TestContentType',
          sys: {
            id: testAddingEntryId,
            linkType: 'Entry',
            type: 'Link',
          },
        },
      });
    });

    it('if reference is not in entityReferenceMap but has a __typename it does not call sendMessageToEditor', () => {
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

      // value has not changed, just sends message back to editor
      expect(updateFn({ data, update })).toEqual({
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
    });
  });

  describe('multi reference fields', () => {
    it('calls sendMessageToEditor when entry being added is not in the entityReferenceMap', () => {
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
      const sendMessageToEditor = vi.spyOn(Utils, 'sendMessageToEditor').mockReturnThis();
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

      // value has not changed, just sends message back to editor
      expect(updateFn({ data, update })).toEqual({
        __typename: 'Page',
        sys: {
          id: entry.sys.id,
        },
        referenceManyCollection: {
          items: [],
        },
      });
      expect(sendMessageToEditor).toHaveBeenCalled();
    });

    it('generates a __typename when entry being added is in the entityReferenceMap then adds this to the modified return value', () => {
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

      const entityReferenceMap = new EntryReferenceMap();
      entityReferenceMap.set(testAddingEntryId, {
        sys: {
          contentType: {
            sys: {
              id: testContentTypeId,
              type: 'TestContentTypeForManyRef',
              linkType: 'Entry',
            },
          },
        },
      } as EntryProps<KeyValueMap>);

      // value has not changed, just sends message back to editor
      expect(updateFn({ data, update, entityReferenceMap })).toEqual({
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

    it('if reference is not in entityReferenceMap but has a __typename it does not call sendMessageToEditor', () => {
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

      // value has not changed, just sends message back to editor
      expect(updateFn({ data, update })).toEqual({
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
  });

  it('falls back to null for empty fields', () => {
    const data = {
      shortText: 'oldValue',
      sys: {
        id: entry.sys.id,
      },
    };

    const update = updateFn({ data, locale: 'n/a' });

    expect(update).toEqual({
      shortText: null,
      sys: {
        id: entry.sys.id,
      },
    });
  });
});
