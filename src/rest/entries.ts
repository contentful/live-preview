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
  dataFromPreviewApp: EntryProps,
  updateFromEntryEditor: any,
  name: string,
  locale: string,
  entityReferenceMap: EntryReferenceMap
) {
  // The information contains only the sys information, load the whole reference from entryReferenceMap
  // and then merge them togehter
  const match = entityReferenceMap.get(updateFromEntryEditor.sys.id);
  if (!match) {
    sendMessageToEditor({
      action: 'ENTITY_NOT_KNOWN',
      referenceEntityId: updateFromEntryEditor.sys.id,
      referenceContentType: updateFromEntryEditor.sys.linkType,
    });
    return;
  }

  // Update or add
  dataFromPreviewApp.fields[name] = clone(match);
  for (const key in match.fields) {
    const value = match.fields[key][locale];
    if (typeof value === 'object' && value.sys) {
      updateSingleReference(
        dataFromPreviewApp.fields[name],
        match,
        locale,
        key,
        entityReferenceMap
      );
    } else if (Array.isArray(value) && value[0]?.sys) {
      updateMultiRefField(dataFromPreviewApp.fields[name], match, locale, key, entityReferenceMap);
    } else {
      updatePrimitiveField(dataFromPreviewApp.fields[name].fields, match, key, locale);
    }
  }
}

function updateSingleReference(
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

  resolveSingleRef(
    dataFromPreviewApp,
    matchUpdateFromEntryEditor,
    name,
    locale,
    entityReferenceMap
  );
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

  updateFromEntryEditor.fields[name][locale].forEach((singleRef) => {
    resolveSingleRef(dataFromPreviewApp, singleRef, name, locale, entityReferenceMap);
  });
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
  for (const field of contentType.fields) {
    const name = getFieldName(contentType, field);

    if (isPrimitiveField(field) || field.type === 'RichText' || field.type === 'File') {
      updatePrimitiveField(dataFromPreviewApp.fields, updateFromEntryEditor, name, locale);
    } else if (field.type === 'Link') {
      // TODO: adding an author doesnt show the name - error in merging?
      updateSingleReference(
        dataFromPreviewApp,
        updateFromEntryEditor,
        locale,
        name,
        entityReferenceMap
      );
    } else if (field.type === 'Array' && field.items?.type === 'Link') {
      // TODO: Adding two references, only one is applied
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
