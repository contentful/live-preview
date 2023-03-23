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

export type Entity = Record<string, unknown>;
export type Argument = Entity | Entity[];
export type SubscribeCallback = (data: Argument) => void;

export interface SysProps {
  id: string;
  [key: string]: unknown;
}

export interface CollectionItem {
  sys: SysProps;
}
