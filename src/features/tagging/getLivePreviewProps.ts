export type LivePreviewProps = {
  fieldId: string | null | undefined;
  entryId: string | null | undefined;
  locale: string | null | undefined;
};

export const getLivePreviewProps = ({ fieldId, entryId, locale }: LivePreviewProps) => {
  return {
    'data-contentful-field-id': fieldId,
    'data-contentful-entry-id': entryId,
    'data-contentful-locale': locale,
  };
};
