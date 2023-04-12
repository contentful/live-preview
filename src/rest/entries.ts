import { EntryProps } from 'contentful-management/types';

import { isPrimitiveField, updatePrimitiveField } from '../helpers';
import { ContentType } from '../types';

/**
 * Updates REST response data based on CMA entry object
 *
 * @param contentType ContentTypeProps
 * @param dataFromPreviewApp Entity - The REST response to be updated
 * @param updateFromEntryEditor EntryProps - CMA entry object containing the update
 * @param locale string - Locale code
 * @returns Entity - Updated REST response data
 */
export function updateEntry(
  { fields }: ContentType,
  dataFromPreviewApp: EntryProps,
  updateFromEntryEditor: EntryProps,
  locale: string
): EntryProps {
  const mergedObj = { ...dataFromPreviewApp };

  for (const field of fields) {
    const name = field.apiName ?? field.name;

    if (isPrimitiveField(field) || field.type === 'RichText') {
      updatePrimitiveField(dataFromPreviewApp.fields, updateFromEntryEditor, name, locale);
      mergedObj.fields[name] = dataFromPreviewApp.fields[name];
    } else if (field.type === 'Link') {
      // update single ref field
    } else if (field.type === 'Array' && field.items?.type === 'Link') {
      // update multi ref field
    }
  }

  return mergedObj;
}
