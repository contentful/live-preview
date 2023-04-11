import { ContentFields, EntryProps } from 'contentful-management/types';

import type { Entity } from '../types';

const PRIMITIVE_FIELDS = new Set([
  'Symbol',
  'Text',
  'Integer',
  'Boolean',
  'Date',
  'Location',
  'Object',
]);

export function updatePrimitiveField(
  dataFromPreviewApp: Entity,
  updateFromEntryEditor: EntryProps,
  name: string,
  locale: string
): void {
  if (name in dataFromPreviewApp) {
    dataFromPreviewApp[name] = updateFromEntryEditor.fields?.[name]?.[locale] ?? null;
  }
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
