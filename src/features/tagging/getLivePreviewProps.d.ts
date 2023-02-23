export type LivePreviewProps = {
    fieldId: string | null | undefined;
    entryId: string | null | undefined;
    locale: string | null | undefined;
};
export declare const getLivePreviewProps: ({ fieldId, entryId, locale }: LivePreviewProps) => {
    'data-contentful-field-id': string | null | undefined;
    'data-contentful-entry-id': string | null | undefined;
    'data-contentful-locale': string | null | undefined;
};
