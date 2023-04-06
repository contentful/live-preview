import { EntryProps } from 'contentful-management/types';
import { describe, it, expect } from 'vitest';

import { SysProps, Entity } from '../../types';
import { updateEntry } from '../entries';
import contentType from './fixtures/contentType.json';
import dataFromPreviewApp from './fixtures/dataFromPreviewApp.json';
import entry from './fixtures/updateFromEntryEditor.json';

const EN = 'en-US';

describe('Update REST entry', () => {
  const updateFn = ({
    dataFromPreviewApp,
    updateFromEntryEditor = entry,
    locale = EN,
  }: {
    dataFromPreviewApp: Entity & { sys: SysProps };
    updateFromEntryEditor?: EntryProps;
    locale?: string;
  }) => {
    return updateEntry(contentType, dataFromPreviewApp, updateFromEntryEditor, locale);
  };

  it('updates primitive fields', () => {
    expect(updateFn({ dataFromPreviewApp })).toEqual({
      ...dataFromPreviewApp,
      fields: {
        ...dataFromPreviewApp.fields,
        shortText: entry.fields.shortText[EN],
        shortTextUrl: entry.fields.shortTextUrl[EN],
        shortTextSlug: entry.fields.shortTextSlug[EN],
        longText: entry.fields.longText[EN],
        richText: entry.fields.richText[EN],
        numberInteger: entry.fields.numberInteger[EN],
        numberDecimal: entry.fields.numberDecimal[EN],
        dateTime: entry.fields.dateTime[EN],
        location: entry.fields.location[EN],
        boolean: entry.fields.boolean[EN],
        json: entry.fields.json[EN],
      },
    });
  });
});
