import type { AssetProps, EntryProps, SysLink } from 'contentful-management';

import { clone, isPrimitiveField, sendMessageToEditor, updatePrimitiveField } from '../helpers';
import { ContentType, EntityReferenceMap } from '../types';

type Reference = AssetProps | EntryProps;

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
 * Update the reference from the entry editor with the information from the entityReferenceMap.
 * If the information is not yet available, it send a message to the editor to retrieve it.
 */
function updateRef(
  dataFromPreviewApp: Reference | undefined,
  updateFromEntryEditor: Reference | SysLink,
  locale: string,
  entityReferenceMap: EntityReferenceMap
): Reference | undefined | null {
  // The information contains only the sys information,
  // load the whole reference from EntityReferenceMap
  // and then merge them together
  const match = entityReferenceMap.get(updateFromEntryEditor.sys.id);
  if (!match) {
    sendMessageToEditor({
      action: 'ENTITY_NOT_KNOWN',
      referenceEntityId: updateFromEntryEditor.sys.id,
      referenceContentType:
        'linkType' in updateFromEntryEditor.sys ? updateFromEntryEditor.sys.linkType : undefined,
    });
    return dataFromPreviewApp;
  }

  // Entity is already in the reference map, so let's apply it on the data
  const result = clone(match) as Reference;

  for (const key in match.fields) {
    const value = match.fields[key as keyof typeof match.fields][locale];

    if (typeof value === 'object' && value.sys) {
      updateSingleRefField(
        result,
        match,
        locale,
        key as keyof Reference['fields'],
        entityReferenceMap
      );
    } else if (Array.isArray(value) && value[0]?.sys) {
      updateMultiRefField(
        result,
        match,
        locale,
        key as keyof Reference['fields'],
        entityReferenceMap
      );
    } else {
      updatePrimitiveField(result.fields, match, key, locale);
    }
  }

  return result;
}

/** Update multi reference fields, resolves deeper nested references and fields */
function updateMultiRefField(
  dataFromPreviewApp: Reference,
  updateFromEntryEditor: Reference,
  locale: string,
  name: keyof Reference['fields'],
  entityReferenceMap: EntityReferenceMap
) {
  if (!updateFromEntryEditor.fields?.[name]?.[locale]) {
    delete dataFromPreviewApp.fields[name];
    return;
  }

  dataFromPreviewApp.fields[name] = updateFromEntryEditor.fields[name][locale]
    .map((updateFromEntryReference: Reference, index: number) =>
      updateRef(
        dataFromPreviewApp.fields[name]?.[index],
        updateFromEntryReference,
        locale,
        entityReferenceMap
      )
    )
    .filter(Boolean);
}

/** Update a single reference field, resolves also deeper references */
function updateSingleRefField(
  dataFromPreviewApp: Reference,
  updateFromEntryEditor: Reference,
  locale: string,
  name: keyof Reference['fields'],
  entityReferenceMap: EntityReferenceMap
) {
  const matchUpdateFromEntryEditor = updateFromEntryEditor?.fields?.[name]?.[locale];
  const matchDataFromPreviewApp = dataFromPreviewApp.fields[name];

  // If it does no longer exist, remove it from the preview data
  if (!matchUpdateFromEntryEditor) {
    delete dataFromPreviewApp.fields[name];
    return;
  }

  // otherwise update it with the new reference
  dataFromPreviewApp.fields[name] = updateRef(
    matchDataFromPreviewApp,
    matchUpdateFromEntryEditor,
    locale,
    entityReferenceMap
  );
}

/**
 * Updates REST response data based on CMA entry object
 *
 * @param contentType
 * @param dataFromPreviewApp The REST response to be updated
 * @param updateFromEntryEditor CMA entry object containing the update
 * @param locale Locale code
 * @returns Updated REST response data
 */
export function updateEntity(
  contentType: ContentType,
  dataFromPreviewApp: EntryProps,
  updateFromEntryEditor: EntryProps | AssetProps,
  locale: string,
  entityReferenceMap: EntityReferenceMap
): EntryProps {
  if (dataFromPreviewApp.sys.id !== updateFromEntryEditor.sys.id) {
    return dataFromPreviewApp;
  }

  for (const field of contentType.fields) {
    const name = getFieldName(contentType, field);

    if (isPrimitiveField(field) || field.type === 'RichText' || field.type === 'File') {
      updatePrimitiveField(dataFromPreviewApp.fields, updateFromEntryEditor, name, locale);
    } else if (field.type === 'Link') {
      updateSingleRefField(
        dataFromPreviewApp,
        updateFromEntryEditor,
        locale,
        name as keyof Reference['fields'],
        entityReferenceMap
      );
    } else if (field.type === 'Array' && field.items?.type === 'Link') {
      updateMultiRefField(
        dataFromPreviewApp,
        updateFromEntryEditor,
        locale,
        name as keyof Reference['fields'],
        entityReferenceMap
      );
    }
  }

  return dataFromPreviewApp;
}
