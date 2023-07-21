import type { Asset, Entry } from 'contentful';
import type { ContentFields } from 'contentful-management';

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
  updateFromEntryEditor: Asset | Entry;
  name: string;
}

export function updatePrimitiveField({
  dataFromPreviewApp,
  updateFromEntryEditor,
  name,
}: PrimitiveFieldArgs): void {
  dataFromPreviewApp[name] =
    updateFromEntryEditor.fields?.[name as keyof (Asset['fields'] | Entry['fields'])] ?? null;
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
