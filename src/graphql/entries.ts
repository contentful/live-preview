import type { AssetProps, EntryProps } from 'contentful-management';

import { isPrimitiveField, sendMessageToEditor, updatePrimitiveField } from '../helpers';
import { CollectionItem, SysProps, EntryReferenceMap, Entity, ContentType } from '../types';
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
export function updateEntry(
  contentType: ContentType,
  dataFromPreviewApp: Entity & { sys: SysProps },
  updateFromEntryEditor: EntryProps,
  locale: string,
  entityReferenceMap: EntryReferenceMap
): Entity & { sys: SysProps } {
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
      updateRichTextField(copyOfDataFromPreviewApp, updateFromEntryEditor, name, locale);
    } else if (field.type === 'Link') {
      updateSingleRefField(
        copyOfDataFromPreviewApp,
        updateFromEntryEditor,
        name,
        locale,
        entityReferenceMap
      );
    } else if (field.type === 'Array' && field.items?.type === 'Link') {
      updateMultiRefField(
        copyOfDataFromPreviewApp,
        updateFromEntryEditor,
        name,
        locale,
        entityReferenceMap
      );
    }
  }

  return copyOfDataFromPreviewApp;
}

function updateRichTextField(
  dataFromPreviewApp: Entity,
  updateFromEntryEditor: EntryProps,
  name: string,
  locale: string
) {
  if (name in dataFromPreviewApp) {
    if (!dataFromPreviewApp[name]) {
      dataFromPreviewApp[name] = {};
    }
    (dataFromPreviewApp[name] as { json: unknown }).json =
      updateFromEntryEditor?.fields?.[name]?.[locale] ?? null;
  }
}

function getContentTypenameFromEntityReferenceMap(
  referenceMap: EntryReferenceMap,
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

const ASSET_TYPENAME = 'Asset';
function isAsset(entity: EntryProps): boolean {
  return 'linkType' in entity.sys && entity.sys.linkType === ASSET_TYPENAME;
}

function updateReferenceAssetField(
  referenceFromPreviewApp: (EntryProps & { __typename?: string }) | null | undefined,
  updatedReference: EntryProps & { __typename?: string },
  entityReferenceMap: EntryReferenceMap,
  locale: string
) {
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
  entityReferenceMap: EntryReferenceMap
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

function updateReferenceField(
  referenceFromPreviewApp: (EntryProps & { __typename?: string }) | null | undefined,
  updatedReference: (EntryProps & { __typename?: string }) | null | undefined,
  entityReferenceMap: EntryReferenceMap,
  locale: string
) {
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
    return updateReferenceAssetField(
      referenceFromPreviewApp,
      updatedReference,
      entityReferenceMap,
      locale
    );
  }

  return updateReferenceEntryField(referenceFromPreviewApp, updatedReference, entityReferenceMap);
}

function updateSingleRefField(
  dataFromPreviewApp: Entity,
  updateFromEntryEditor: EntryProps,
  name: string,
  locale: string,
  entityReferenceMap: EntryReferenceMap
) {
  if (name in dataFromPreviewApp) {
    dataFromPreviewApp[name] = updateReferenceField(
      dataFromPreviewApp[name] as EntryProps & { __typename?: string },
      updateFromEntryEditor?.fields?.[name]?.[locale],
      entityReferenceMap,
      locale
    );
  }
}

function updateMultiRefField(
  dataFromPreviewApp: Entity,
  updateFromEntryEditor: EntryProps,
  name: string,
  locale: string,
  entityReferenceMap: EntryReferenceMap
) {
  const fieldName = `${name}Collection`;
  if (fieldName in dataFromPreviewApp) {
    const dataFromPreviewAppItems =
      updateFromEntryEditor?.fields?.[name]?.[locale]
        .map((updatedItem: any) => {
          const itemFromPreviewApp = (
            dataFromPreviewApp[fieldName] as { items: CollectionItem[] }
          ).items.find((item) => item.sys.id === updatedItem.sys.id);

          return updateReferenceField(
            itemFromPreviewApp as unknown as EntryProps & { __typename?: string },
            updatedItem as unknown as EntryProps,
            entityReferenceMap,
            locale
          );
        })
        .filter(Boolean) ?? [];
    (dataFromPreviewApp[fieldName] as { items: CollectionItem[] }).items = dataFromPreviewAppItems;
  }
}
