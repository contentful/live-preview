import type { AssetProps, EntryProps } from 'contentful-management';

export function patchField<T extends EntryProps | AssetProps>(
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
