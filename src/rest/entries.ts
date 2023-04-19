import type { AssetProps, EntryProps } from 'contentful-management';

import { clone, isPrimitiveField, sendMessageToEditor, updatePrimitiveField } from '../helpers';
import { ContentType, EntryReferenceMap } from '../types';

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

function resolveSingleRef(
  updateFromEntryEditor: any,
  locale: string,
  entityReferenceMap: EntryReferenceMap
): EntryProps | null {
  // The information contains only the sys information, load the whole reference from entryReferenceMap
  // and then merge them togehter
  const match = entityReferenceMap.get(updateFromEntryEditor.sys.id);
  if (!match) {
    sendMessageToEditor({
      action: 'ENTITY_NOT_KNOWN',
      referenceEntityId: updateFromEntryEditor.sys.id,
      referenceContentType: updateFromEntryEditor.sys.linkType,
    });
    return null;
  }

  const result = clone(match) as EntryProps;

  for (const key in match.fields) {
    const value = match.fields[key][locale];

    if (typeof value === 'object' && value.sys) {
      updateSingleRef(result, match, locale, key, entityReferenceMap);
    } else if (Array.isArray(value) && value[0]?.sys) {
      updateMultiRefField(result, match, locale, key, entityReferenceMap);
    } else {
      result.fields[key] = value;
    }
  }

  return result;
}

function updateMultiRefField(
  dataFromPreviewApp: EntryProps,
  updateFromEntryEditor: EntryProps | AssetProps,
  locale: string,
  name: string,
  entityReferenceMap: EntryReferenceMap
) {
  if (!updateFromEntryEditor.fields?.[name]?.[locale]) {
    delete dataFromPreviewApp.fields[name];
    return;
  }

  const originalData = dataFromPreviewApp.fields[name] || [];
  const dataFromPreviewAppLength = originalData.length ?? 0;
  const updateFromEntryEditorLength = updateFromEntryEditor.fields[name][locale].length;

  // the next code block hurts, needs an urgent refactor
  if (dataFromPreviewAppLength > updateFromEntryEditorLength) {
    dataFromPreviewApp.fields[name] = dataFromPreviewApp.fields[name].filter((entry) =>
      updateFromEntryEditor.fields[name][locale].some(
        (updatedEntry) => updatedEntry.sys.id === entry.sys.id
      )
    );
  } else {
    const newList = [];
    for (const updateFromEntryRefrence of updateFromEntryEditor.fields[name][locale]) {
      // const match = originalData.find((e) => e.sys.id === updateFromEntryRefrence.sys.id);
      // if (match) {
      //   // already exist, keep the original one
      //   newList.push(match);
      // } else {
      newList.push(resolveSingleRef(updateFromEntryRefrence, locale, entityReferenceMap));
      // }
    }
    dataFromPreviewApp.fields[name] = newList.filter(Boolean);
  }
}

function updateSingleRef(
  dataFromPreviewApp: EntryProps,
  updateFromEntryEditor: EntryProps | AssetProps,
  locale: string,
  name: string | number,
  entityReferenceMap: EntryReferenceMap
) {
  const matchUpdateFromEntryEditor = updateFromEntryEditor?.fields?.[name]?.[locale];

  if (!matchUpdateFromEntryEditor) {
    delete dataFromPreviewApp.fields[name];
    return;
  }

  dataFromPreviewApp.fields[name] = resolveSingleRef(
    matchUpdateFromEntryEditor,
    locale,
    entityReferenceMap
  );
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
  locale: string,
  entityReferenceMap: EntryReferenceMap
): EntryProps {
  if (dataFromPreviewApp.sys.id !== updateFromEntryEditor.sys.id) {
    return dataFromPreviewApp;
  }

  for (const field of contentType.fields) {
    const name = getFieldName(contentType, field);

    if (isPrimitiveField(field) || field.type === 'RichText' || field.type === 'File') {
      updatePrimitiveField(dataFromPreviewApp.fields, updateFromEntryEditor, name, locale);
    } else if (field.type === 'Link') {
      updateSingleRef(dataFromPreviewApp, updateFromEntryEditor, locale, name, entityReferenceMap);
    } else if (field.type === 'Array' && field.items?.type === 'Link') {
      updateMultiRefField(
        dataFromPreviewApp,
        updateFromEntryEditor,
        locale,
        name,
        entityReferenceMap
      );
    }
  }

  return dataFromPreviewApp;
}
