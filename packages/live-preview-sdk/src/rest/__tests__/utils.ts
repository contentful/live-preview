import type { Asset, Entry } from 'contentful';

export function patchField<T extends Asset | Entry>(
  originalData: T,
  name: keyof T['fields'],
  value: unknown
) {
  return {
    ...originalData,
    fields: {
      ...originalData.fields,
      [name]: value,
    },
  };
}
