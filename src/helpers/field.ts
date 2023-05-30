import type { AssetProps, ContentFields, EntryProps, KeyValueMap } from 'contentful-management';

import type { Entity } from '../types';

const PRIMITIVE_FIELDS = new Set([
  'Symbol',
  'Text',
  'Integer',
  'Number',
  'Boolean',
  'Date',
  'Location',
  'Object',
]);

interface PrimitiveFieldArgs {
  dataFromPreviewApp: Entity;
  updateFromEntryEditor: EntryProps | AssetProps;
  name: string;
  locale: string;
}

export function updatePrimitiveField({
  dataFromPreviewApp,
  updateFromEntryEditor,
  name,
  locale,
}: PrimitiveFieldArgs): void {
  dataFromPreviewApp[name] =
    (updateFromEntryEditor.fields as KeyValueMap | undefined)?.[name]?.[locale] ?? null;
}

export function isPrimitiveField(field: ContentFields): boolean {
  if (PRIMITIVE_FIELDS.has(field.type)) {
    return true;
  }

  // Array of Symbols
  if (field.type === 'Array' && field.items?.type === 'Symbol') {
    return true;
  }

  return false;
}
