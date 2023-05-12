import type { AssetProps, EntryProps } from 'contentful-management';

import { isPrimitiveField, sendMessageToEditor, updatePrimitiveField } from '../helpers';
import {
  CollectionItem,
  SysProps,
  EntityReferenceMap,
  Entity,
  ASSET_TYPENAME,
  UpdateFieldProps,
  UpdateReferenceFieldProps,
  UpdateEntryProps,
} from '../types';
import { updateAsset } from './assets';
import { logUnrecognizedFields } from './utils';

/**
 * Updates GraphQL response data based on CMA entry object
 *
 * @param contentType ContentTypeProps
 * @param dataFromPreviewApp Entity - The GraphQL response to be updated
 * @param updateFromEntryEditor EntryProps - CMA entry object containing the update
 * @param locale string - Locale code
 * @returns Entity - Updated GraphQL response data
 */
export function updateEntry({
  contentType,
  dataFromPreviewApp,
  updateFromEntryEditor,
  locale,
  entityReferenceMap,
}: UpdateEntryProps): Entity & { sys: SysProps } {
  if (dataFromPreviewApp.sys.id !== updateFromEntryEditor.sys.id) {
    return dataFromPreviewApp;
  }

  const copyOfDataFromPreviewApp = { ...dataFromPreviewApp };
  const { fields } = contentType;

  // TODO: On GraphQL the suffix `Collection` is added for multiple references
  logUnrecognizedFields(
    fields.map((f) => f.apiName ?? f.name),
    dataFromPreviewApp
  );

  for (const field of fields) {
    const name = field.apiName ?? field.name;

    if (isPrimitiveField(field)) {
      updatePrimitiveField(copyOfDataFromPreviewApp, updateFromEntryEditor, name, locale);
    } else if (field.type === 'RichText') {
      updateRichTextField({
        dataFromPreviewApp: copyOfDataFromPreviewApp,
        updateFromEntryEditor,
        name,
        locale,
      });
    } else if (field.type === 'Link') {
      updateSingleRefField({
        dataFromPreviewApp: copyOfDataFromPreviewApp,
        updateFromEntryEditor,
        name,
        locale,
        entityReferenceMap,
      });
    } else if (field.type === 'Array' && field.items?.type === 'Link') {
      updateMultiRefField({
        dataFromPreviewApp: copyOfDataFromPreviewApp,
        updateFromEntryEditor,
        name,
        locale,
        entityReferenceMap,
      });
    }
  }

  return copyOfDataFromPreviewApp;
}

function updateRichTextField({
  dataFromPreviewApp,
  updateFromEntryEditor,
  name,
  locale,
}: UpdateFieldProps) {
  if (name in dataFromPreviewApp) {
    if (!dataFromPreviewApp[name]) {
      dataFromPreviewApp[name] = {};
    }
    (dataFromPreviewApp[name] as { json: unknown }).json =
      updateFromEntryEditor?.fields?.[name]?.[locale] ?? null;
  }
}

function getContentTypenameFromEntityReferenceMap(
  referenceMap: EntityReferenceMap,
  entityId?: string
) {
  if (referenceMap && entityId) {
    const entity = referenceMap.get(entityId);
    if (entity) {
      const contentTypeId = entity.sys.contentType.sys.id;
      const typename = contentTypeId.charAt(0).toUpperCase() + contentTypeId.slice(1);
      return typename;
    }
  }
}

function isAsset(entity: EntryProps): boolean {
  return 'linkType' in entity.sys && entity.sys.linkType === ASSET_TYPENAME;
}

function updateReferenceAssetField({
  referenceFromPreviewApp,
  updatedReference,
  entityReferenceMap,
  locale,
}: UpdateReferenceFieldProps) {
  const match = entityReferenceMap.get(updatedReference.sys.id) as AssetProps | undefined;

  if (!match) {
    // if we don't have the asset we send a message back to the entry editor
    // and it will then send the asset back in the entity reference map
    // where we can calculate the asset on the next update message.
    sendMessageToEditor({
      action: 'ENTITY_NOT_KNOWN',
      referenceEntityId: updatedReference.sys.id,
      referenceContentType: ASSET_TYPENAME,
    });
    return;
  }

  return updateAsset(
    { ...referenceFromPreviewApp, ...updatedReference, __typename: ASSET_TYPENAME },
    match,
    locale
  );
}

function updateReferenceEntryField(
  referenceFromPreviewApp: (EntryProps & { __typename?: string }) | null | undefined,
  updatedReference: EntryProps & { __typename?: string },
  entityReferenceMap: EntityReferenceMap
) {
  const entityTypename = getContentTypenameFromEntityReferenceMap(
    entityReferenceMap,
    updatedReference.sys.id
  );

  // if we have the typename of the updated reference, we can return with it
  if (entityTypename) {
    return { ...referenceFromPreviewApp, ...updatedReference, __typename: entityTypename };
  }

  // if we don't have the typename we send a message back to the entry editor
  // and it will then send the reference back in the entity reference map
  // where we can calculate the typename on the next update message.
  sendMessageToEditor({
    action: 'ENTITY_NOT_KNOWN',
    referenceEntityId: updatedReference.sys.id,
  });
  return null;
}

function updateReferenceField({
  referenceFromPreviewApp,
  updatedReference,
  entityReferenceMap,
  locale,
}: UpdateReferenceFieldProps) {
  if (!updatedReference) {
    return null;
  }

  // it's already in graphql format so we can return
  if (referenceFromPreviewApp && referenceFromPreviewApp.__typename) {
    return referenceFromPreviewApp;
  }

  if (updatedReference.__typename) {
    return updatedReference;
  }

  if (isAsset(updatedReference)) {
    return updateReferenceAssetField({
      referenceFromPreviewApp,
      updatedReference,
      entityReferenceMap,
      locale,
    });
  }

  return updateReferenceEntryField(referenceFromPreviewApp, updatedReference, entityReferenceMap);
}

function updateSingleRefField({
  dataFromPreviewApp,
  updateFromEntryEditor,
  name,
  locale,
  entityReferenceMap,
}: UpdateFieldProps) {
  if (name in dataFromPreviewApp) {
    dataFromPreviewApp[name] = updateReferenceField({
      referenceFromPreviewApp: dataFromPreviewApp[name] as EntryProps & { __typename?: string },
      updatedReference: updateFromEntryEditor?.fields?.[name]?.[locale],
      entityReferenceMap: entityReferenceMap as EntityReferenceMap,
      locale,
    });
  }
}

function updateMultiRefField({
  dataFromPreviewApp,
  updateFromEntryEditor,
  name,
  locale,
  entityReferenceMap,
}: UpdateFieldProps) {
  const fieldName = `${name}Collection`;
  if (fieldName in dataFromPreviewApp) {
    const dataFromPreviewAppItems =
      updateFromEntryEditor?.fields?.[name]?.[locale]
        .map((updatedItem: EntryProps) => {
          const itemFromPreviewApp = (
            dataFromPreviewApp[fieldName] as { items: CollectionItem[] }
          ).items.find((item) => item.sys.id === updatedItem.sys.id);

          return updateReferenceField({
            referenceFromPreviewApp: itemFromPreviewApp as unknown as EntryProps & {
              __typename?: string;
            },
            updatedReference: updatedItem,
            entityReferenceMap: entityReferenceMap as EntityReferenceMap,
            locale,
          });
        })
        .filter(Boolean) ?? [];
    (dataFromPreviewApp[fieldName] as { items: CollectionItem[] }).items = dataFromPreviewAppItems;
  }
}
