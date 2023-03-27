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
  entityReferenceMap: Map<string, EntryProps | AssetProps>
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
  updatedReference: EntryProps & { __typename?: string },
  entityReferenceMap: Map<string, EntryProps | AssetProps>
) {
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
    return null;
  }
}

function updateSingleRefField(
  dataFromPreviewApp: Record<string, unknown>,
  updateFromEntryEditor: EntryProps,
  name: string,
  locale: string,
  entityReferenceMap: Map<string, EntryProps | AssetProps>
) {
  if (name in dataFromPreviewApp) {
    const updatedReference = updateFromEntryEditor?.fields?.[name]?.[locale] ?? null;
    dataFromPreviewApp[name] = updateReferenceField(updatedReference, entityReferenceMap);
  }
}

function updateMultiRefField(
  dataFromPreviewApp: Record<string, unknown>,
  updateFromEntryEditor: EntryProps,
  name: string,
  locale: string,
  entityReferenceMap: Map<string, EntryProps | AssetProps>
) {
  const fieldName = `${name}Collection`;
  if (fieldName in dataFromPreviewApp) {
    const dataFromPreviewAppItems =
      updateFromEntryEditor?.fields?.[name]?.[locale]
        .map((dataFromPreviewAppItem: any) => {
          return updateReferenceField(
            dataFromPreviewAppItem as unknown as EntryProps,
            entityReferenceMap
          );
        })
        .filter(Boolean) ?? [];
    (dataFromPreviewApp[fieldName] as { items: CollectionItem[] }).items = dataFromPreviewAppItems;
  }
}
