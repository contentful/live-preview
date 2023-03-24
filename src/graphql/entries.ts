import { ContentTypeProps, EntryProps, AssetProps } from 'contentful-management/types';

import { CollectionItem, SysProps } from '../types';
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
    const dataFromPreviewAppItems = updateFromEntryEditor?.fields?.[name]?.[locale].map(
      (dataFromPreviewAppItem: any) => {
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
        } else {
          // TODO: ask web app to fetch and message again
          sendMessageToEditor({
            action: 'fetchReferenceEntity',
            referenceEntityId: dataFromPreviewAppItem.sys.id,
          });
        }

        return dataFromPreviewAppRef;
      }
    );
    (dataFromPreviewApp[fieldName] as { items: CollectionItem[] }).items = dataFromPreviewAppItems;
  }
}
