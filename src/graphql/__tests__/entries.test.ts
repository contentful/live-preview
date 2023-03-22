import { EntryProps } from 'contentful-management/types';
import { describe, it, expect, vi, afterEach } from 'vitest';

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
  }: {
    data: Record<string, unknown>;
    update?: EntryProps;
    locale?: string;
  }) => {
    return updateEntry(contentType, data, update, locale);
  };

  it('keeps __typename unchanged', () => {
    const warn = vi.spyOn(console, 'warn');
    const data = { __typename: 'CT', shortText: 'text' };

    const update = updateFn({ data });

    expect(update).toEqual(
      expect.objectContaining({
        __typename: 'CT',
      })
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns but keeps unknown fields', () => {
    const data = { unknownField: 'text' };
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
    });
  });

  it('falls back to null for empty fields', () => {
    const data = {
      shortText: 'oldValue',
    };

    const update = updateFn({ data, locale: 'n/a' });

    expect(update).toEqual({
      shortText: null,
    });
  });
});
