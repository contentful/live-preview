import { BLOCKS, INLINES } from '@contentful/rich-text-types';
import { Asset, Entry } from 'contentful';
import type { SetOptional } from 'type-fest';

import { isPrimitiveField, updatePrimitiveField, resolveReference, clone, debug } from '../helpers';
import { SUPPORTED_RICHTEXT_EMBEDS, isAsset, isRichText } from '../helpers/entities';
import {
  CollectionItem,
  SysProps,
  Entity,
  ASSET_TYPENAME,
  UpdateFieldProps,
  UpdateReferenceFieldProps,
  UpdateEntryProps,
  GraphQLParams,
  GetStore,
} from '../types';
import { updateAsset } from './assets';
import { isRelevantField, updateAliasedInformation } from './queryUtils';
import { buildCollectionName, generateTypeName } from './utils';
import { MAX_RTE_DEPTH } from '../constants';

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
  maxDepth,
  ...props
}: UpdateEntryProps): Promise<Entity & { sys: SysProps }> {
  if (dataFromPreviewApp.sys.id !== updateFromEntryEditor.sys.id) {
    return dataFromPreviewApp;
  }
  const copyOfDataFromPreviewApp = clone(dataFromPreviewApp);
  const typename = generateTypeName(contentType.sys.id);

  for (const field of contentType.fields) {
    const name = field.apiName ?? field.name;
    if (isRelevantField(name, typename, props.gqlParams)) {
      if (isPrimitiveField(field)) {
        updatePrimitiveField({
          dataFromPreviewApp: copyOfDataFromPreviewApp,
          updateFromEntryEditor,
          name,
        });
      } else if (field.type === 'RichText') {
        await updateRichTextField({
          ...props,
          dataFromPreviewApp: copyOfDataFromPreviewApp,
          updateFromEntryEditor,
          name,
          maxDepth: MAX_RTE_DEPTH,
        });
      } else if (field.type === 'Link') {
        await updateSingleRefField({
          ...props,
          dataFromPreviewApp: copyOfDataFromPreviewApp,
          updateFromEntryEditor,
          name,
          maxDepth: maxDepth - 1,
        });
      } else if (field.type === 'Array' && field.items?.type === 'Link') {
        await updateMultiRefField({
          ...props,
          dataFromPreviewApp: copyOfDataFromPreviewApp,
          updateFromEntryEditor,
          name,
          maxDepth: maxDepth - 1,
        });
      }
    }
  }

  return updateAliasedInformation(copyOfDataFromPreviewApp, typename, props.gqlParams);
}

interface RichTextLink {
  block: (Entity & CollectionItem)[];
  inline: (Entity & CollectionItem)[];
  hyperlink: (Entity & CollectionItem)[];
}

function isEntityLinkEmpty(obj: RichTextLink) {
  return Object.values(obj).every((arr) => arr.length === 0);
}

async function processNode({
  node,
  entries,
  assets,
  ...props
}: {
  node: any;
  entries: RichTextLink;
  assets: RichTextLink;
  locale: string;
  getStore: GetStore;
  gqlParams?: GraphQLParams;
  maxDepth: number;
}) {
  // Check if the node is an embedded entity
  if (SUPPORTED_RICHTEXT_EMBEDS.includes(node.nodeType)) {
    if (node.data && node.data.target && node.data.target.sys) {
      const updatedReference = {
        sys: { ...node.data.target.sys, type: 'Link', linkType: node.data.target.sys.type },
      };

      let ref;
      // Use the updateReferenceEntryField or updateReferenceAssetField function to resolve the entity reference
      if (node.data.target.sys.linkType === 'Entry') {
        ref = await updateReferenceEntryField({
          ...props,
          referenceFromPreviewApp: null,
          updatedReference,
        });
      } else if (node.data.target.sys.linkType === 'Asset') {
        ref = await updateReferenceAssetField({
          ...props,
          referenceFromPreviewApp: null,
          updatedReference,
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
      await processNode({
        ...props,
        node: contentNode,
        entries,
        assets,
      });
    }
  }
}

async function processRichTextField({
  richTextNode,
  ...props
}: {
  richTextNode: any | null;
  locale: string;
  getStore: GetStore;
  gqlParams?: GraphQLParams;
  maxDepth: number;
}): Promise<{ entries: RichTextLink; assets: RichTextLink }> {
  const entries: RichTextLink = { block: [], inline: [], hyperlink: [] };
  const assets: RichTextLink = { block: [], inline: [], hyperlink: [] };

  if (richTextNode) {
    for (const node of richTextNode.content) {
      await processNode({
        ...props,
        node,
        entries,
        assets,
      });
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
  gqlParams,
  getStore,
  maxDepth,
}: UpdateFieldProps) {
  if (!dataFromPreviewApp[name]) {
    dataFromPreviewApp[name] = {};
  }

  // Update the rich text JSON data
  (dataFromPreviewApp[name] as { json: unknown }).json =
    updateFromEntryEditor?.fields?.[name] || null;

  // Update the rich text embedded entries
  dataFromPreviewApp[name].links = await processRichTextField({
    richTextNode: dataFromPreviewApp[name].json,
    locale,
    getStore,
    gqlParams,
    maxDepth,
  });
}

async function updateReferenceAssetField({
  referenceFromPreviewApp,
  updatedReference,
  locale,
  gqlParams,
  getStore,
}: SetOptional<Required<UpdateReferenceFieldProps>, 'gqlParams'>) {
  const { reference } = await resolveReference({
    referenceId: updatedReference.sys.id,
    isAsset: true,
    locale,
    getStore,
  });

  return updateAsset(
    {
      ...referenceFromPreviewApp,
      ...updatedReference,
      __typename: ASSET_TYPENAME,
    } as unknown as Entity & CollectionItem,
    reference,
    gqlParams
  );
}

function isInDepthLimit(entityId: string, maxDepth: number, gqlParams?: GraphQLParams): boolean {
  if (gqlParams) {
    return true;
  }

  if (maxDepth > 0) {
    return true;
  }

  debug.log(
    'Max update depth is reached, please provide the GraphQL query if you need deeper nested information.',
    { entityId }
  );
  return false;
}

function getRichTextDepth(maxDepth: number) {
  return Math.min(maxDepth - 1, MAX_RTE_DEPTH);
}

async function updateReferenceEntryField({
  referenceFromPreviewApp,
  updatedReference,
  locale,
  gqlParams,
  getStore,
  maxDepth,
}: SetOptional<Required<UpdateReferenceFieldProps>, 'gqlParams'>) {
  const { reference, typeName } = await resolveReference({
    referenceId: updatedReference.sys.id,
    locale,
    getStore,
  });

  // If we have the typename of the updated reference, we can work with it
  const merged = {
    ...referenceFromPreviewApp,
    ...updatedReference,
    __typename: typeName,
  } as unknown as Entity & CollectionItem;

  // TODO: kind of duplication with line 46, check if we can combine them
  for (const key in reference.fields) {
    if (!isRelevantField(key, typeName, gqlParams)) {
      continue;
    }

    const value = reference.fields[key as keyof typeof reference.fields];
    if (value && typeof value === 'object') {
      if (isRichText(value)) {
        // richtext
        merged[key] = { json: value };
        merged[key].links = await processRichTextField({
          richTextNode: value,
          locale,
          gqlParams,
          maxDepth: getRichTextDepth(maxDepth),
          getStore,
        });
      }

      if ('sys' in value && isInDepthLimit(updatedReference.sys.id, maxDepth, gqlParams)) {
        // single reference
        merged[key] = value;
        await updateSingleRefField({
          dataFromPreviewApp: merged,
          updateFromEntryEditor: reference,
          locale,
          name: key,
          gqlParams,
          getStore,
          maxDepth: maxDepth - 1,
        });
      }
    } else if (
      Array.isArray(value) &&
      value[0]?.sys &&
      isInDepthLimit(updatedReference.sys.id, maxDepth, gqlParams)
    ) {
      // multi references
      const name = buildCollectionName(key);
      merged[name] = { items: value };
      await updateMultiRefField({
        dataFromPreviewApp: merged,
        updateFromEntryEditor: reference,
        locale,
        name: key,
        gqlParams,
        getStore,
        maxDepth: maxDepth - 1,
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
  ...props
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
      ...props,
      referenceFromPreviewApp,
      updatedReference,
    });
  }

  return updateReferenceEntryField({
    ...props,
    referenceFromPreviewApp,
    updatedReference,
  });
}

async function updateSingleRefField({
  dataFromPreviewApp,
  updateFromEntryEditor,
  name,
  maxDepth,
  ...props
}: UpdateFieldProps) {
  const updatedReference = updateFromEntryEditor?.fields?.[name] as Asset | Entry | undefined;
  dataFromPreviewApp[name] = await updateReferenceField({
    ...props,
    referenceFromPreviewApp: dataFromPreviewApp[name] as Entry & {
      __typename?: string;
    },
    updatedReference,
    maxDepth: maxDepth - 1,
  });
}

async function updateMultiRefField({
  dataFromPreviewApp,
  updateFromEntryEditor,
  name,
  maxDepth,
  ...props
}: UpdateFieldProps) {
  const fieldName = buildCollectionName(name);

  const list = (updateFromEntryEditor?.fields?.[name] || []) as Entry[];
  const dataFromPreviewAppItems = await Promise.all(
    list.map(async (updatedItem) => {
      const itemFromPreviewApp = (
        dataFromPreviewApp[fieldName] as { items: CollectionItem[] } | undefined
      )?.items?.find((item) => item.sys.id === updatedItem.sys.id);

      const result = await updateReferenceField({
        ...props,
        referenceFromPreviewApp: itemFromPreviewApp as unknown as Entry & {
          __typename?: string;
        },
        updatedReference: updatedItem,
        maxDepth: maxDepth - 1,
      });

      return result;
    })
  );

  if (!dataFromPreviewApp[fieldName]) {
    dataFromPreviewApp[fieldName] = { items: [] };
  }

  dataFromPreviewApp[fieldName].items = dataFromPreviewAppItems.filter(Boolean);
}
