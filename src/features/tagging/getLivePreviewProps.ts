export type LivePreviewProps = {
  fieldId: string | null | undefined;
  entryId: string | null | undefined;
  locale: string | null | undefined;
};

enum TagAttributes {
  FIELD_ID = 'data-contentful-field-id',
  ENTRY_ID = 'data-contentful-entry-id',
  LOCALE = 'data-contentful-locale',
}

export const getLivePreviewProps = ({ fieldId, entryId, locale }: LivePreviewProps) => {
  return {
    [TagAttributes.FIELD_ID]: fieldId,
    [TagAttributes.ENTRY_ID]: entryId,
    [TagAttributes.LOCALE]: locale,
    onClick: () =>
      window.top?.postMessage(
        {
          fieldId,
          entryId,
          locale,
        },
        //todo: check if there is any security risk with this
        '*'
      ),
  };
};
