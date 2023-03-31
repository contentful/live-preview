import type { EntryProps } from 'contentful-management/types';

import { CollectionItem, SysProps, EntryReferenceMap, Entity, ContentType } from '../types';
import { sendMessageToEditor } from '../utils';
import { isPrimitiveField, logUnrecognizedFields } from './utils';

/**
 * Updates GraphQL response data based on CMA entry object
 *
 * @param contentType ContentTypeProps
 * @param data Entity - The GraphQL response to be updated
 * @param update EntryProps - CMA entry object containing the update
 * @param locale string - Locale code
 * @returns Entity - Updated GraphQL response data
 */
export function updateEntry(
  contentType: ContentType,
  data: Entity & { sys: SysProps },
  update: EntryProps,
  locale: string,
  entityReferenceMap: EntryReferenceMap
): Entity & { sys: SysProps } {
  if (data.sys.id !== update.sys.id) {
    return data;
  }

  const modified = { ...data };
  const { fields } = contentType;

  logUnrecognizedFields(
    fields.map((f) => f.apiName ?? f.name),
    data
  );

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

function updatePrimitiveField(modified: Entity, update: EntryProps, name: string, locale: string) {
  if (name in modified) {
    modified[name] = update.fields?.[name]?.[locale] ?? null;
  }
}

function updateRichTextField(modified: Entity, update: EntryProps, name: string, locale: string) {
  if (name in modified) {
    if (!modified[name]) {
      modified[name] = {};
    }
    (modified[name] as { json: unknown }).json = update?.fields?.[name]?.[locale] ?? null;
  }
}

function getContentTypenameFromEntityReferenceMap(
  referenceMap: EntryReferenceMap,
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
  referenceFromPreviewApp: (EntryProps & { __typename?: string }) | null | undefined,
  updatedReference: (EntryProps & { __typename?: string }) | null | undefined,
  entityReferenceMap: EntryReferenceMap
) {
  // if the reference was deleted return null
  if (!updatedReference) {
    return null;
  }

  // it's already in graphql format so we can return
  if (referenceFromPreviewApp && referenceFromPreviewApp.__typename) {
    return referenceFromPreviewApp;
  }

  if (updatedReference && updatedReference.__typename) {
    return updatedReference;
  }

  const entityTypename = getContentTypenameFromEntityReferenceMap(
    entityReferenceMap,
    updatedReference.sys.id
  );
  // if we have the typename of the updated reference, we can return with it
  if (entityTypename) {
    return { ...referenceFromPreviewApp, ...updatedReference, __typename: entityTypename };
  } else {
    // if we don't have the typename we send a message back to the entry editor
    // and it will then send the reference back in the entity reference map
    // where we can calculate the typename on the next update message.
    sendMessageToEditor({
      action: 'ENTITY_NOT_KNOWN',
      data: {
        referenceEntityId: updatedReference.sys.id,
      },
    });
    return null;
  }
}

function updateSingleRefField(
  dataFromPreviewApp: Entity,
  updateFromEntryEditor: EntryProps,
  name: string,
  locale: string,
  entityReferenceMap: EntryReferenceMap
) {
  if (name in dataFromPreviewApp) {
    const updatedReference = updateFromEntryEditor?.fields?.[name]?.[locale] ?? null;
    dataFromPreviewApp[name] = updateReferenceField(
      dataFromPreviewApp[name] as EntryProps & { __typename?: string },
      updatedReference,
      entityReferenceMap
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
            entityReferenceMap
          );
        })
        .filter(Boolean) ?? [];
    (dataFromPreviewApp[fieldName] as { items: CollectionItem[] }).items = dataFromPreviewAppItems;
  }
}
