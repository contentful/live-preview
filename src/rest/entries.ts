import { EntryProps, ContentTypeProps } from 'contentful-management/types';
import { ContentFields } from 'contentful-management/types';

import { SysProps, Entity } from '../types';
import { isPrimitiveField, updatePrimitiveField } from '../utils';

const mergeFields = (fields: ContentFields[], initialObj: any, updatedObj: any, locale: string) => {
  const mergedObj = { ...initialObj };

  for (const field of fields) {
    const name = field.apiName ?? field.name;

    if (isPrimitiveField(field) || field.type === 'RichText') {
      updatePrimitiveField(initialObj.fields, updatedObj, name, locale);
    } else if (field.type === 'Link') {
      // updateSingleRefField(modified, update, name, locale, entityReferenceMap);
    } else if (field.type === 'Array' && field.items?.type === 'Link') {
      // updateMultiRefField(modified, update, name, locale, entityReferenceMap);
    }
  }

  return mergedObj;
};

type DataField = Entity & { sys: SysProps };

function updateNestedRef(
  fields: ContentFields[],
  data: DataField,
  updated: EntryProps,
  locale: string
) {
  if (data.fields) {
    for (const field of Object.values(data.fields)) {
      if (field.sys?.id) {
        if (field.sys.id === updated.sys.id) {
          mergeFields(fields, field, updated, locale);
        } else {
          updateNestedRef(fields, field, updated, locale);
        }
      }
    }
  }
}

/**
 * Updates REST response data based on CMA entry object
 *
 *  @param contentType ContentTypeProps
 * @param data Entity - The REST response to be updated
 * @param update EntryProps - CMA entry object containing the update
 * @param locale string - Locale code
 * @returns Entity - Updated REST response data
 */
export function updateEntry(
  contentType: ContentTypeProps,
  data: (Entity & { sys: SysProps }) | Array<Entity & { sys: SysProps }>,
  update: EntryProps,
  locale: string
): (Entity & { sys: SysProps }) | Array<Entity & { sys: SysProps }> {
  const { fields } = contentType;
  console.log({ data, update });

  // Check if 'data' is an array
  if (Array.isArray(data)) {
    // Create a new array based on the original 'data' array
    const newArray = [...data];

    // Find the object with the same sys.id as the 'updated' object
    const index = newArray.findIndex((item) => item.sys.id === update.sys.id);

    // check if an element with a matching sys.id was found in the initial array
    if (index !== -1) {
      // Update the fields of the object found in the 'newArray' using the content from the 'updated' object
      newArray[index] = mergeFields(fields, newArray[index], update, locale);
      return newArray;
    }
    updateNestedRef(fields, newArray[0], update, locale);
    return newArray;
  } else {
    // If 'initial' is an object, update its fields using the content from the 'updated' object
    if (data.sys.id === update.sys.id) {
      //update data
    }
  }

  return data;
}
