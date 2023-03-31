import type { AssetProps, EntryProps, ContentTypeProps } from 'contentful-management';

export type ContentType = ContentTypeProps;

export type LivePreviewProps = {
  fieldId: string | null | undefined;
  entryId: string | null | undefined;
  locale: string | null | undefined;
};

export const enum TagAttributes {
  FIELD_ID = 'data-contentful-field-id',
  ENTRY_ID = 'data-contentful-entry-id',
  LOCALE = 'data-contentful-locale',
}

// TODO: this has kind of overlap with CollectionItem, can we combine them?
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

type IframeConnectedMessage = {
  action: 'IFRAME_CONNECTED';
  connected: true;
  tags: number;
};
type TaggedFieldClickMessage = {
  action: 'TAGGED_FIELD_CLICKED';
  fieldId: string;
  entryId: string;
  locale: string;
};
type UnknownEntityMessage = {
  action: 'ENTITY_NOT_KNOWN';
  referenceEntityId: string;
};
export type EditorMessage = IframeConnectedMessage | TaggedFieldClickMessage | UnknownEntityMessage;
export type MessageFromSDK = EditorMessage & {
  from: 'live-preview';
  location: string;
};

export class EntryReferenceMap extends Map<string, EntryProps | AssetProps> {}
