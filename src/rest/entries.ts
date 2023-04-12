import type { AssetProps, EntryProps } from 'contentful-management';

import { isPrimitiveField, updatePrimitiveField } from '../helpers';
import { ContentType } from '../types';

/**
 * Resolves the correct field name from the ContentType
 * (Asset needs the ID as it is an internal type)
 */
function getFieldName(contentType: ContentType, field: ContentType['fields'][number]): string {
  if (contentType.name === 'Asset') {
    return field.id;
  }

  return field.apiName || field.name;
}

/**
 * Updates REST response data based on CMA entry object
 *
 * @param contentType ContentTypeProps
 * @param dataFromPreviewApp Entity - The REST response to be updated
 * @param updateFromEntryEditor EntryProps - CMA entry object containing the update
 * @param locale string - Locale code
 * @returns Entity - Updated REST response data
 */
export function updateEntity(
  contentType: ContentType,
  dataFromPreviewApp: EntryProps,
  updateFromEntryEditor: EntryProps | AssetProps,
  locale: string
): EntryProps {
  for (const field of contentType.fields) {
    const name = getFieldName(contentType, field);

    if (isPrimitiveField(field) || field.type === 'RichText' || field.type === 'File') {
      updatePrimitiveField(dataFromPreviewApp.fields, updateFromEntryEditor, name, locale);
    } else if (field.type === 'Link') {
      // update single ref field
    } else if (field.type === 'Array' && field.items?.type === 'Link') {
      // update multi ref field
    }
  }

  return dataFromPreviewApp;
}
