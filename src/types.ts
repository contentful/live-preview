import type { AssetProps, EntryProps } from 'contentful-management';

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
  __typename?: string;
}

export enum MessageAction {
  IFRAME_CONNECTED = 'IFRAME_CONNECTED',
  TAGGED_FIELD_CLICKED = 'TAGGED_FIELD_CLICKED',
  ENTITY_NOT_KNOWN = 'ENTITY_NOT_KNOWN',
}

export class EntryReferenceMap extends Map<string, EntryProps | AssetProps> {}
