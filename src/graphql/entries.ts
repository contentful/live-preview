import { ContentTypeProps, EntryProps, AssetProps } from 'contentful-management/types';

import { CollectionItem, SysProps, MessageAction } from '../types';
import { sendMessageToEditor } from '../utils';
import { isPrimitiveField, logUnrecognizedFields } from './utils';

/**
 * Updates GraphQL response data based on CMA entry object
 *
 * @param contentType ContentTypeProps
 * @param data Record<string, unknown> - The GraphQL response to be updated
 * @param update EntryProps - CMA entry object containing the update
 * @param locale string - Locale code
 * @returns Record<string, unknown> - Updated GraphQL response data
 */
export function updateEntry(
  contentType: ContentTypeProps,
  data: Record<string, unknown> & { sys: SysProps },
  update: EntryProps,
  locale: string,
  entityReferenceMap: any
): Record<string, unknown> & { sys: SysProps } {
  const modified = { ...data };
  const { fields } = contentType;

  logUnrecognizedFields(
    fields.map((f) => f.apiName ?? f.name),
    data
  );

  if (modified.sys.id !== update.sys.id) {
    return modified;
  }

  for (const field of fields) {
    const name = field.apiName ?? field.name;

    if (isPrimitiveField(field)) {
      updatePrimitiveField(modified, update, name, locale);
    } else if (field.type === 'RichText') {
      updateRichTextField(modified, update, name, locale);
    } else if (field.type === 'Link') {
      updateSingleRefField(modified, update, name, locale, entityReferenceMap);
    } else if (field.type === 'Array' && field.items?.type === 'Link') {
      updateMultiRefField(modified, update, name, locale, entityReferenceMap);
    }
  }

  return modified;
}

function updatePrimitiveField(
  modified: Record<string, unknown>,
  update: EntryProps,
  name: string,
  locale: string
) {
  if (name in modified) {
    modified[name] = update.fields?.[name]?.[locale] ?? null;
  }
}

function updateRichTextField(
  modified: Record<string, unknown>,
  update: EntryProps,
  name: string,
  locale: string
) {
  if (name in modified) {
    if (!modified[name]) {
      modified[name] = {};
    }
    (modified[name] as { json: unknown }).json = update?.fields?.[name]?.[locale] ?? null;
  }
}

function getContentTypenameFromEntityReferenceMap(
  referenceMap: Map<string, EntryProps | AssetProps>,
  entityId?: string
) {
  if (referenceMap && entityId) {
    const entity = referenceMap.get(entityId);
    if (entity) {
      const contentTypeId = entity.sys.contentType?.sys.id;
      const typename = contentTypeId.charAt(0).toUpperCase() + contentTypeId.slice(1);
      return typename;
    }
  }
}

function updateReferenceField(
  updateFromEntryEditor: EntryProps,
  fieldName: string,
  locale: string,
  entityReferenceMap: any
) {
  const updatedReference = updateFromEntryEditor?.fields?.[fieldName]?.[locale] ?? null;
  // if the reference was deleted return null
  if (updatedReference === null) {
    return null;
  }

  // it's already in graphql format so we can return
  if (updatedReference && updatedReference.__typename) {
    return updatedReference;
  }

  const entityTypename = getContentTypenameFromEntityReferenceMap(
    entityReferenceMap,
    updatedReference.sys.id
  );
  // if we have the typename of the updated reference, we can return with it
  if (entityTypename) {
    return { ...updatedReference, __typename: entityTypename };
  } else {
    // if we don't have the typename we send a message back to the entry editor
    // and it will then send the reference back in the entity reference map
    // where we can calculate the typename on the next update message.
    sendMessageToEditor(MessageAction.ENTITY_NOT_KNOWN, {
      referenceEntityId: updatedReference.sys.id,
    });
  }
}

function updateSingleRefField(
  dataFromPreviewApp: Record<string, unknown>,
  updateFromEntryEditor: EntryProps,
  name: string,
  locale: string,
  entityReferenceMap: any
) {
  if (name in dataFromPreviewApp) {
    dataFromPreviewApp[name] = updateReferenceField(
      updateFromEntryEditor,
      name,
      locale,
      entityReferenceMap
    );
  }
}

function updateMultiRefField(
  dataFromPreviewApp: Record<string, unknown>,
  updateFromEntryEditor: EntryProps,
  name: string,
  locale: string,
  entityReferenceMap: any
) {
  const fieldName = `${name}Collection`;

  if (fieldName in dataFromPreviewApp) {
    const originalCollection = dataFromPreviewApp[fieldName] as { items: CollectionItem[] };
    const dataFromPreviewAppItems =
      updateFromEntryEditor?.fields?.[name]?.[locale]
        .map((dataFromPreviewAppItem: any) => {
          const currentItem = originalCollection.items.find(
            (item) => item.sys.id === dataFromPreviewAppItem.sys.id
          );

          // it's already in graphql format so we can return
          if (currentItem && currentItem.__typename) {
            return currentItem;
          }

          const dataFromPreviewAppRef = { ...dataFromPreviewAppItem };

          const entityTypename = getContentTypenameFromEntityReferenceMap(
            entityReferenceMap,
            dataFromPreviewAppItem.sys.id
          );

          if (entityTypename) {
            dataFromPreviewAppRef.__typename = entityTypename;
            return dataFromPreviewAppRef;
          } else {
            sendMessageToEditor(MessageAction.ENTITY_NOT_KNOWN, {
              referenceEntityId: dataFromPreviewAppItem.sys.id,
            });
          }
        })
        .filter(Boolean) ?? [];
    (dataFromPreviewApp[fieldName] as { items: CollectionItem[] }).items = dataFromPreviewAppItems;
  }
}
