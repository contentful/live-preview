import { BLOCKS, INLINES } from '@contentful/rich-text-types';
import type { EntryProps } from 'contentful-management';

import { updateAsset } from './assets';
import { isRelevantField, updateAliasedInformation } from './queryUtils';
import { buildCollectionName } from './utils';
import {
  isPrimitiveField,
  updatePrimitiveField,
  resolveReference,
  clone,
  debug,
  generateTypeName,
} from '../helpers';
import {
  CollectionItem,
  SysProps,
  EntityReferenceMap,
  Entity,
  ASSET_TYPENAME,
  UpdateFieldProps,
  UpdateReferenceFieldProps,
  UpdateEntryProps,
  isAsset,
  GraphQLParams,
} from '../types';

/**
 * Updates GraphQL response data based on CMA entry object
 *
 * @param contentType ContentTypeProps
 * @param dataFromPreviewApp Entity - The GraphQL response to be updated
 * @param updateFromEntryEditor EntryProps - CMA entry object containing the update
 * @param locale string - Locale code
 * @returns Entity - Updated GraphQL response data
 */
export async function updateEntry({
  contentType,
  dataFromPreviewApp,
  updateFromEntryEditor,
  locale,
  entityReferenceMap,
  gqlParams,
}: UpdateEntryProps): Promise<Entity & { sys: SysProps }> {
  if (dataFromPreviewApp.sys.id !== updateFromEntryEditor.sys.id) {
    return dataFromPreviewApp;
  }
  const copyOfDataFromPreviewApp = clone(dataFromPreviewApp);
  const typename = generateTypeName(contentType.sys.id);

  for (const field of contentType.fields) {
    const name = field.apiName ?? field.name;
    if (isRelevantField(name, typename, gqlParams)) {
      if (isPrimitiveField(field)) {
        updatePrimitiveField({
          dataFromPreviewApp: copyOfDataFromPreviewApp,
          updateFromEntryEditor,
          name,
          locale,
        });
      } else if (field.type === 'RichText') {
        await updateRichTextField({
          dataFromPreviewApp: copyOfDataFromPreviewApp,
          updateFromEntryEditor,
          entityReferenceMap,
          name,
          locale,
          gqlParams,
        });
      } else if (field.type === 'Link') {
        await updateSingleRefField({
          dataFromPreviewApp: copyOfDataFromPreviewApp,
          updateFromEntryEditor,
          name,
          locale,
          entityReferenceMap,
          gqlParams,
        });
      } else if (field.type === 'Array' && field.items?.type === 'Link') {
        await updateMultiRefField({
          dataFromPreviewApp: copyOfDataFromPreviewApp,
          updateFromEntryEditor,
          name,
          locale,
          entityReferenceMap,
          gqlParams,
        });
      }
    }
  }

  return updateAliasedInformation(copyOfDataFromPreviewApp, typename, gqlParams);
}

interface RichTextLink {
  block: (Entity & CollectionItem)[];
  inline: (Entity & CollectionItem)[];
  hyperlink: (Entity & CollectionItem)[];
}

function isEntityLinkEmpty(obj: RichTextLink) {
  return Object.values(obj).every((arr) => arr.length === 0);
}

async function processNode(
  node: any,
  entries: RichTextLink,
  assets: RichTextLink,
  entityReferenceMap: EntityReferenceMap,
  locale: string,
  gqlParams?: GraphQLParams
) {
  // Check if the node is an embedded entity
  if (
    node.nodeType === BLOCKS.EMBEDDED_ENTRY ||
    node.nodeType === BLOCKS.EMBEDDED_ASSET ||
    node.nodeType === INLINES.EMBEDDED_ENTRY ||
    node.nodeType === INLINES.ENTRY_HYPERLINK ||
    node.nodeType === INLINES.ASSET_HYPERLINK
  ) {
    if (node.data && node.data.target && node.data.target.sys) {
      const id = node.data.target?.sys.id || '';
      const updatedReference = {
        sys: { id: id, type: 'Link', linkType: node.data.target.sys.type },
      };

      let ref;
      // Use the updateReferenceEntryField or updateReferenceAssetField function to resolve the entity reference
      if (node.data.target.sys.linkType === 'Entry') {
        ref = await updateReferenceEntryField({
          referenceFromPreviewApp: null,
          updatedReference,
          entityReferenceMap,
          locale,
          gqlParams,
        });
      } else if (node.data.target.sys.linkType === 'Asset') {
        ref = await updateReferenceAssetField({
          referenceFromPreviewApp: null,
          updatedReference,
          entityReferenceMap,
          locale,
          gqlParams,
        });
      }

      if (ref) {
        // Depending on the node type, assign the resolved reference to the appropriate array
        switch (node.nodeType) {
          case BLOCKS.EMBEDDED_ENTRY:
            entries.block.push(ref);
            break;
          case BLOCKS.EMBEDDED_ASSET:
            assets.block.push(ref);
            break;
          case INLINES.EMBEDDED_ENTRY:
            entries.inline.push(ref);
            break;
          case INLINES.ENTRY_HYPERLINK:
            entries.hyperlink.push(ref);
            break;
          case INLINES.ASSET_HYPERLINK:
            assets.hyperlink.push(ref);
            break;
          default:
            debug.warn('Unhandled nodeType in embedded entries in rich text', {
              nodeType: node.nodeType,
              ref,
            });
        }
      }
    }
  } else if (node.content) {
    // since embedded entries can be part of other rich text content (e.g. embedded inline entries)
    // we need to recursively check for these entries to display them
    for (const contentNode of node.content) {
      await processNode(contentNode, entries, assets, entityReferenceMap, locale, gqlParams);
    }
  }
}

async function processRichTextField(
  richTextNode: any | null,
  entityReferenceMap: EntityReferenceMap,
  locale: string,
  gqlParams?: GraphQLParams
): Promise<{ entries: RichTextLink; assets: RichTextLink }> {
  const entries: RichTextLink = { block: [], inline: [], hyperlink: [] };
  const assets: RichTextLink = { block: [], inline: [], hyperlink: [] };

  if (richTextNode) {
    for (const node of richTextNode.content) {
      await processNode(node, entries, assets, entityReferenceMap, locale, gqlParams);
    }
  }

  return {
    entries: isEntityLinkEmpty(entries) ? { block: [], inline: [], hyperlink: [] } : entries,
    assets: isEntityLinkEmpty(assets) ? { block: [], inline: [], hyperlink: [] } : assets,
  };
}

async function updateRichTextField({
  dataFromPreviewApp,
  updateFromEntryEditor,
  name,
  locale,
  entityReferenceMap,
  gqlParams,
}: UpdateFieldProps) {
  if (!dataFromPreviewApp[name]) {
    dataFromPreviewApp[name] = {};
  }

  // Update the rich text JSON data
  (dataFromPreviewApp[name] as { json: unknown }).json =
    updateFromEntryEditor?.fields?.[name]?.[locale] ?? null;

  // Update the rich text embedded entries
  dataFromPreviewApp[name].links = await processRichTextField(
    dataFromPreviewApp[name].json,
    entityReferenceMap,
    locale,
    gqlParams
  );
}

async function updateReferenceAssetField({
  referenceFromPreviewApp,
  updatedReference,
  entityReferenceMap,
  locale,
  gqlParams,
}: UpdateReferenceFieldProps) {
  const { reference } = await resolveReference({
    entityReferenceMap,
    referenceId: updatedReference.sys.id,
    isAsset: true,
    locale
  });

  return updateAsset(
    { ...referenceFromPreviewApp, ...updatedReference, __typename: ASSET_TYPENAME },
    reference,
    locale,
    gqlParams
  );
}

async function updateReferenceEntryField({
  referenceFromPreviewApp,
  updatedReference,
  entityReferenceMap,
  locale,
  gqlParams,
}: UpdateReferenceFieldProps) {
  const { reference, typeName } = await resolveReference({
    entityReferenceMap,
    referenceId: updatedReference.sys.id,
    locale
  });

  // If we have the typename of the updated reference, we can work with it
  const merged = {
    ...referenceFromPreviewApp,
    ...updatedReference,
    __typename: typeName,
  } as Entity & CollectionItem;

  // TODO: kind of duplication with line 46, check if we can combine them
  for (const key in reference.fields) {
    if (!isRelevantField(key, typeName, gqlParams)) {
      continue;
    }

    const value = reference.fields[key as keyof typeof reference.fields][locale];
    if (value && typeof value === 'object') {
      if (value.nodeType === 'document') {
        // richtext
        merged[key] = { json: value };
        merged[key].links = await processRichTextField(value, entityReferenceMap, locale);
      }

      if (value.sys) {
        // single reference
        merged[key] = value;
        await updateSingleRefField({
          dataFromPreviewApp: merged,
          updateFromEntryEditor: reference,
          locale,
          entityReferenceMap,
          name: key,
          gqlParams,
        });
      }
    } else if (Array.isArray(value) && value[0]?.sys) {
      // multi references
      const name = buildCollectionName(key);
      merged[name] = { items: value };
      await updateMultiRefField({
        dataFromPreviewApp: merged,
        updateFromEntryEditor: reference,
        locale,
        entityReferenceMap,
        name: key,
        gqlParams,
      });
    } else {
      // primitive fields
      merged[key] = value;
    }
  }

  return updateAliasedInformation(merged, typeName, gqlParams);
}

async function updateReferenceField({
  referenceFromPreviewApp,
  updatedReference,
  entityReferenceMap,
  locale,
  gqlParams,
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
      gqlParams,
    });
  }

  return updateReferenceEntryField({
    referenceFromPreviewApp,
    updatedReference,
    entityReferenceMap,
    locale,
    gqlParams,
  });
}

async function updateSingleRefField({
  dataFromPreviewApp,
  updateFromEntryEditor,
  name,
  locale,
  entityReferenceMap,
  gqlParams,
}: UpdateFieldProps) {
  dataFromPreviewApp[name] = await updateReferenceField({
    referenceFromPreviewApp: dataFromPreviewApp[name] as EntryProps & {
      __typename?: string;
    },
    updatedReference: updateFromEntryEditor?.fields?.[name]?.[locale],
    entityReferenceMap: entityReferenceMap as EntityReferenceMap,
    locale,
    gqlParams,
  });
}

async function updateMultiRefField({
  dataFromPreviewApp,
  updateFromEntryEditor,
  name,
  locale,
  entityReferenceMap,
  gqlParams,
}: UpdateFieldProps) {
  const fieldName = buildCollectionName(name);

  const list = updateFromEntryEditor?.fields?.[name]?.[locale] ?? [];
  const dataFromPreviewAppItems = await Promise.all(
    list.map(async (updatedItem: Entity & CollectionItem) => {
      const itemFromPreviewApp = (
        dataFromPreviewApp[fieldName] as { items: CollectionItem[] } | undefined
      )?.items?.find((item) => item.sys.id === updatedItem.sys.id);

      const result = await updateReferenceField({
        referenceFromPreviewApp: itemFromPreviewApp as unknown as EntryProps & {
          __typename?: string;
        },
        updatedReference: updatedItem,
        entityReferenceMap: entityReferenceMap as EntityReferenceMap,
        locale,
        gqlParams,
      });

      return result;
    })
  );

  if (!dataFromPreviewApp[fieldName]) {
    dataFromPreviewApp[fieldName] = { items: [] };
  }

  (dataFromPreviewApp[fieldName] as { items: CollectionItem[] }).items =
    dataFromPreviewAppItems.filter(Boolean);
}
