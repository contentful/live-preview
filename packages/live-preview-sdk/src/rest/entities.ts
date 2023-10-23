import { Asset, Entry } from 'contentful';
import type { WithResourceName } from 'contentful-management';

import { MAX_DEPTH } from '../constants';
import {
  debug,
  clone,
  isPrimitiveField,
  resolveReference,
  updatePrimitiveField,
  SendMessage,
} from '../helpers';
import {
  SUPPORTED_RICHTEXT_EMBEDS,
  isAsset,
  isEntityLink,
  isResourceLink,
  isRichText,
} from '../helpers/entities';
import { ContentType, EntityReferenceMap } from '../types';

export type Reference = Asset | Entry | WithResourceName<Entry>;

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
async function updateRef(
  dataFromPreviewApp: Reference | undefined,
  updateFromEntryEditor: Reference,
  locale: string,
  entityReferenceMap: EntityReferenceMap,
  depth: number,
  visitedReferenceMap: Map<string, Reference>,
  sendMessage: SendMessage
): Promise<Reference | undefined | null> {
  let reference;
  const id =
    'urn' in updateFromEntryEditor.sys
      ? updateFromEntryEditor.sys.urn
      : updateFromEntryEditor.sys.id;

  // If the ID of the updateFromEntryEditor is in visitedReferences, then stop the recursion
  if (visitedReferenceMap.has(id)) {
    debug.warn('Detected a circular reference, stopping recursion');
    reference = visitedReferenceMap.get(id);
  } else {
    const { reference: resolvedReference } = await resolveReference({
      entityReferenceMap,
      referenceId: updateFromEntryEditor.sys.id,
      ...(isAsset(updateFromEntryEditor) ? { isAsset: true } : undefined),
      locale,
      sendMessage,
    });
    reference = resolvedReference;
    visitedReferenceMap.set(id, resolvedReference);
  }

  if (!reference) {
    return dataFromPreviewApp;
  }

  // Entity is already in the reference map, so let's apply it on the data
  const result = clone(reference);

  // TODO: Refactor so we check based on field types instead of field value https://contentful.atlassian.net/browse/TOL-1285
  for (const key in reference.fields) {
    const value = reference.fields[key as keyof typeof reference.fields];

    // single ref fields
    if (isEntityLink(value) && depth < MAX_DEPTH) {
      await updateSingleRefField(
        result,
        reference,
        locale,
        key as keyof Reference['fields'],
        entityReferenceMap,
        depth + 1,
        visitedReferenceMap,
        sendMessage
      );
      // multi ref fields
    } else if (Array.isArray(value) && isEntityLink(value[0]) && depth < MAX_DEPTH) {
      await updateMultiRefField(
        result,
        reference,
        locale,
        key as keyof Reference['fields'],
        entityReferenceMap,
        depth + 1,
        visitedReferenceMap,
        sendMessage
      );
      // rich text fields
    } else if (isRichText(value)) {
      await updateRichTextField(
        result as Entry,
        reference as Entry,
        key,
        locale,
        entityReferenceMap,
        depth + 1,
        visitedReferenceMap,
        sendMessage
      );
      // single and multi resource link fields
    } else if (isResourceLink(value) || (Array.isArray(value) && isResourceLink(value[0]))) {
      // TODO: add live updates for resource links inside of references
      debug.warn('Detected a resource link, support is still under development.');
      return result;
      // primitive fields
    } else {
      updatePrimitiveField({
        dataFromPreviewApp: result.fields,
        updateFromEntryEditor: reference,
        name: key,
      });
    }
  }

  return result;
}

/** Update multi reference fields, resolves deeper nested references and fields */
async function updateMultiRefField(
  dataFromPreviewApp: Reference,
  updateFromEntryEditor: Reference,
  locale: string,
  name: keyof Reference['fields'],
  entityReferenceMap: EntityReferenceMap,
  depth: number,
  visitedReferenceMap: Map<string, Reference>,
  sendMessage: SendMessage
) {
  if (!updateFromEntryEditor.fields?.[name]) {
    delete dataFromPreviewApp.fields[name];
    return;
  }

  dataFromPreviewApp.fields[name] = (await Promise.all(
    (updateFromEntryEditor.fields[name] as Reference[]).map(
      (updateFromEntryReference: Reference, index: number) =>
        updateRef(
          (dataFromPreviewApp.fields[name] as Reference[])?.[index],
          updateFromEntryReference,
          locale,
          entityReferenceMap,
          depth + 1,
          visitedReferenceMap,
          sendMessage
        )
    )
  ).then((list) => list.filter(Boolean))) as Reference[];

  return dataFromPreviewApp;
}

/** Update a single reference field, resolves also deeper references */
async function updateSingleRefField(
  dataFromPreviewApp: Reference,
  updateFromEntryEditor: Reference,
  locale: string,
  name: keyof Reference['fields'],
  entityReferenceMap: EntityReferenceMap,
  depth: number,
  visitedReferenceMap: Map<string, Reference>,
  sendMessage: SendMessage
) {
  const matchUpdateFromEntryEditor = updateFromEntryEditor?.fields?.[name] as Reference | undefined;

  // If it does no longer exist, remove it from the preview data
  if (!matchUpdateFromEntryEditor) {
    delete dataFromPreviewApp.fields[name];
    return;
  }

  // otherwise update it with the new reference
  dataFromPreviewApp.fields[name] = await updateRef(
    dataFromPreviewApp.fields[name] as Reference | undefined,
    matchUpdateFromEntryEditor,
    locale,
    entityReferenceMap,
    depth + 1,
    visitedReferenceMap,
    sendMessage
  );

  return dataFromPreviewApp;
}

async function resolveRichTextLinks(
  node: any,
  entityReferenceMap: EntityReferenceMap,
  locale: string,
  depth: number,
  visitedReferenceMap: Map<string, Reference>,
  sendMessage: SendMessage
) {
  if (SUPPORTED_RICHTEXT_EMBEDS.includes(node.nodeType)) {
    if (node.data && node.data.target && node.data.target.sys) {
      if (node.data.target.sys.linkType === 'Entry' || node.data.target.sys.linkType === 'Asset') {
        const id = node.data.target?.sys.id || '';
        const updatedReference = {
          sys: { id: id, type: 'Link', linkType: node.data.target.sys.linkType },
        } as unknown as Reference;

        node.data.target = await updateRef(
          undefined,
          updatedReference,
          locale,
          entityReferenceMap,
          depth + 1,
          visitedReferenceMap,
          sendMessage
        );
      }
    }
  }

  if (node.content) {
    for (const childNode of node.content) {
      await resolveRichTextLinks(
        childNode,
        entityReferenceMap,
        locale,
        depth + 1,
visitedReferenceMap,
        sendMessage
      );
    }
  }
}

async function updateRichTextField(
  dataFromPreviewApp: Entry,
  updateFromEntryEditor: Entry,
  name: string,
  locale: string,
  entityReferenceMap: EntityReferenceMap,
  depth: number,
  visitedReferenceMap: Map<string, Reference>,
  sendMessage: SendMessage
) {
  const richText = updateFromEntryEditor.fields?.[name];

  if (isRichText(richText)) {
    // Update the rich text JSON data
    dataFromPreviewApp.fields[name] = richText;
    // Resolve the linked entries or assets within the rich text field
    for (const node of richText.content) {
      await resolveRichTextLinks(
        node,
        entityReferenceMap,
        locale,
        depth,
        visitedReferenceMap,
        sendMessage
      );
    }
  }
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
export async function updateEntity(
  contentType: ContentType,
  dataFromPreviewApp: Entry,
  updateFromEntryEditor: Entry | Asset,
  locale: string,
  entityReferenceMap: EntityReferenceMap,
  depth: number,
  visitedReferenceMap: Map<string, Reference>,
  sendMessage: SendMessage
): Promise<Entry> {
  if (dataFromPreviewApp.sys.id !== updateFromEntryEditor.sys.id) {
    return dataFromPreviewApp;
  }

  for (const field of contentType.fields) {
    const name = getFieldName(contentType, field);

    if (isPrimitiveField(field) || field.type === 'File') {
      updatePrimitiveField({
        dataFromPreviewApp: dataFromPreviewApp.fields,
        updateFromEntryEditor,
        name,
      });
    } else if (field.type === 'Link' && depth < MAX_DEPTH) {
      await updateSingleRefField(
        dataFromPreviewApp,
        updateFromEntryEditor,
        locale,
        name as keyof Reference['fields'],
        entityReferenceMap,
        depth + 1,
        visitedReferenceMap,
        sendMessage
      );
    } else if (field.type === 'Array' && field.items?.type === 'Link' && depth < MAX_DEPTH) {
      await updateMultiRefField(
        dataFromPreviewApp,
        updateFromEntryEditor,
        locale,
        name as keyof Reference['fields'],
        entityReferenceMap,
        depth + 1,
        visitedReferenceMap,
        sendMessage
      );
    } else if (field.type === 'RichText') {
      await updateRichTextField(
        dataFromPreviewApp,
        updateFromEntryEditor as Entry,
        name,
        locale,
        entityReferenceMap,
        depth,
        visitedReferenceMap,
        sendMessage
      );
    } else if (field.type === 'ResourceLink') {
      //@TODO -- add live updates for resource links
      debug.warn('Detected a resource link, support is still under development.');
      return dataFromPreviewApp;
    }
  }

  return dataFromPreviewApp;
}
