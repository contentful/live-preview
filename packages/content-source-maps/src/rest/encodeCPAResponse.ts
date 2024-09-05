import { get, has } from 'json-pointer';

import type {
  CPAEntry,
  CPAEntryCollection,
  EditorInterfaceSource,
  FieldType,
  CreateSourceMapParams,
} from '../types.js';
import {
  clone,
  createSourceMapMetadata,
  encodeField,
  isBuiltinNamespace,
  isSupportedWidget,
} from '../utils.js';

const applyEncoding = (
  target: CPAEntry,
  fieldTypes: FieldType[],
  editorInterfaces: EditorInterfaceSource[],
  targetOrigin?: CreateSourceMapParams['targetOrigin'],
  platform?: CreateSourceMapParams['platform'],
) => {
  if (!target.fields) {
    return;
  }

  const { contentSourceMaps } = target.sys;

  if (!contentSourceMaps) {
    console.error('Content source maps data is missing');
    return;
  }

  const { mappings } = contentSourceMaps;

  for (const pointer in mappings) {
    const { source } = mappings[pointer];
    const space = target.sys.space.sys.id;
    const environment = target.sys.environment.sys.id;
    const entityId = target.sys.id;
    const entityType = target.sys.type;
    const fieldType = fieldTypes[source.fieldType];
    const editorInterface = editorInterfaces[source.editorInterface];

    // Skip unsupported widgets
    if (
      isBuiltinNamespace(editorInterface.widgetNamespace) &&
      !isSupportedWidget(editorInterface.widgetId)
    ) {
      continue;
    }

    const formattedPointer = pointer.startsWith('/') ? pointer : `/${pointer}`;

    if (has(target, formattedPointer)) {
      const currentValue = get(target, formattedPointer);
      if (currentValue === null) {
        return;
      }
      const fieldParts = formattedPointer.split('/'); // Split the pointer into parts
      const field = fieldParts.pop(); // Get the last part, which is the field name
      if (!field) {
        console.error('Field name could not be extracted from the pointer', formattedPointer);
        return;
      }
      const locale = target.sys.locale;

      // Determine if we are dealing with multiple locale values in the response or just a single locale
      if (locale) {
        const hiddenStrings = createSourceMapMetadata({
          entityId,
          entityType,
          space,
          environment,
          field,
          locale,
          editorInterface,
          fieldType,
          targetOrigin,
          platform,
        });

        encodeField(fieldType, currentValue, hiddenStrings, target, formattedPointer, mappings);
      } else {
        const locales = Object.keys(currentValue);
        locales.forEach((locale) => {
          const hiddenStrings = createSourceMapMetadata({
            entityId,
            entityType,
            space,
            environment,
            field,
            locale,
            editorInterface,
            fieldType,
            targetOrigin,
            platform,
          });

          encodeField(
            fieldType,
            currentValue,
            hiddenStrings,
            target,
            `${formattedPointer}/${locale}`,
            mappings,
            locale,
          );
        });
      }
    } else {
      //@TODO - add Sentry logging
      // console.warn(`Pointer ${pointer} not found in the entry`, target);
    }
  }
};

export const encodeCPAResponse = (
  CPAResponse: CPAEntry | CPAEntryCollection,
  targetOrigin?: CreateSourceMapParams['targetOrigin'],
  platform?: CreateSourceMapParams['platform'],
): CPAEntry | CPAEntryCollection => {
  const modifiedCPAResponse = clone(
    CPAResponse as unknown as Record<string, unknown>,
  ) as unknown as CPAEntry | CPAEntryCollection;

  // Entity collections
  if (modifiedCPAResponse.sys && 'items' in (modifiedCPAResponse as CPAEntryCollection)) {
    const collection = modifiedCPAResponse as CPAEntryCollection;
    if (!collection.sys?.contentSourceMapsLookup) {
      console.error('Content source maps lookup data is missing');
      return collection;
    }
    const {
      contentSourceMapsLookup: { fieldTypes, editorInterfaces },
    } = collection.sys;
    const { items, includes } = collection;

    items.forEach((target) =>
      applyEncoding(target, fieldTypes, editorInterfaces, targetOrigin, platform),
    );
    if (includes && includes.Entry) {
      includes.Entry.forEach((entry) =>
        applyEncoding(entry, fieldTypes, editorInterfaces, targetOrigin, platform),
      );
    }
    if (includes && includes.Asset) {
      includes.Asset.forEach((asset) =>
        applyEncoding(asset, fieldTypes, editorInterfaces, targetOrigin, platform),
      );
    }
    // Single entity
  } else {
    const entry = modifiedCPAResponse as CPAEntry;
    if (!entry.sys.contentSourceMapsLookup) {
      console.error('Content source maps lookup data is missing');
      return entry;
    }

    applyEncoding(
      entry,
      entry.sys.contentSourceMapsLookup.fieldTypes,
      entry.sys.contentSourceMapsLookup.editorInterfaces,
      targetOrigin,
      platform,
    );
  }

  return modifiedCPAResponse;
};
