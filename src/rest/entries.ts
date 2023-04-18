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

  // The information contains only the sys information, load the whole reference from entryReferenceMap
  // and then merge them togehter
  const match = entityReferenceMap.get(matchUpdateFromEntryEditor.sys.id);
  if (!match) {
    sendMessageToEditor({
      action: 'ENTITY_NOT_KNOWN',
      referenceEntityId: matchUpdateFromEntryEditor.sys.id,
      referenceContentType: matchUpdateFromEntryEditor.sys.linkType,
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

  // TODO: re-use and share functionality with single ref
  updateFromEntryEditor.fields[name][locale].forEach((singleRef) => {
    const match = entityReferenceMap.get(singleRef.sys.id);
    if (!match) {
      // TODO: performance, on multi ref we're sending it for every ref instead only once with multiple values
      sendMessageToEditor({
        action: 'ENTITY_NOT_KNOWN',
        referenceEntityId: singleRef.sys.id,
        referenceContentType: singleRef.sys.linkType,
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
        updateMultiRefField(
          dataFromPreviewApp.fields[name],
          match,
          locale,
          key,
          entityReferenceMap
        );
      } else {
        updatePrimitiveField(dataFromPreviewApp.fields[name].fields, match, key, locale);
      }
    }
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
      updateSingleReference(
        dataFromPreviewApp,
        updateFromEntryEditor,
        locale,
        name,
        entityReferenceMap
      );
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
