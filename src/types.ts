export type LivePreviewProps = {
  fieldId: string | null | undefined;
  entryId: string | null | undefined;
  locale: string | null | undefined;
};

export enum TagAttributes {
  FIELD_ID = 'data-contentful-field-id',
  ENTRY_ID = 'data-contentful-entry-id',
  LOCALE = 'data-contentful-locale',
}
