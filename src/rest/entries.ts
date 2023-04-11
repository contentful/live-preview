import { EntryProps } from 'contentful-management/types';
import { ContentFields } from 'contentful-management/types';

import { isPrimitiveField, updatePrimitiveField } from '../helpers';
import { SysProps, Entity, ContentType } from '../types';

const mergeFields = (
  fields: ContentFields[],
  dataFromPreviewApp: any,
  updateFromEntryEditor: any,
  locale: string
): Entity & { sys: SysProps } => {
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
};

function updateNestedRef(
  fields: ContentFields[],
  dataFromPreviewApp: Entity & { sys: SysProps },
  updateFromEntryEditor: EntryProps,
  locale: string
): Entity & { sys: SysProps } {
  if (dataFromPreviewApp.fields) {
    const updatedFields = { ...dataFromPreviewApp.fields };

    for (const [fieldName, field] of Object.entries(dataFromPreviewApp.fields)) {
      if (field.sys && field.sys.id === updateFromEntryEditor.sys.id) {
        updatedFields[fieldName] = mergeFields(fields, field, updateFromEntryEditor, locale);
        return { ...dataFromPreviewApp, fields: updatedFields };
      } else if (typeof field === 'object') {
        updateNestedRef(fields, field, updateFromEntryEditor, locale);
      }
    }
  }
  return dataFromPreviewApp;
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
export function updateEntry(
  contentType: ContentType,
  dataFromPreviewApp: Entity & { sys: SysProps },
  updateFromEntryEditor: EntryProps,
  locale: string
): Entity & { sys: SysProps } {
  if (dataFromPreviewApp.sys.id === updateFromEntryEditor.sys.id) {
    return mergeFields(contentType.fields, dataFromPreviewApp, updateFromEntryEditor, locale);
  } else {
    return updateNestedRef(contentType.fields, dataFromPreviewApp, updateFromEntryEditor, locale);
  }
}
