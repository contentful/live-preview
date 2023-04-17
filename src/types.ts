import type { AssetProps, EntryProps, ContentTypeProps } from 'contentful-management';

export type ContentType = ContentTypeProps;
export const ASSET_TYPENAME = 'Asset';

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

export interface SysProps {
  id: string;
  [key: string]: unknown;
}

export type Entity = Record<string, unknown>;
export interface EntityWithSys extends Entity {
  sys: SysProps;
  __typename?: string;
}

export function hasSysInformation(entity: unknown): entity is EntityWithSys {
  return !!(
    entity &&
    typeof entity === 'object' &&
    'sys' in entity &&
    (entity as EntityWithSys).sys.id
  );
}

export type Argument = Entity | Entity[];
export type SubscribeCallback = (data: Argument) => void;

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
  referenceContentType?: string;
};

type UrlChangedMessage = {
  action: 'URL_CHANGED';
};

export type EditorMessage =
  | IframeConnectedMessage
  | TaggedFieldClickMessage
  | UnknownEntityMessage
  | UrlChangedMessage;

export type MessageFromSDK = EditorMessage & {
  from: 'live-preview';
  location: string;
};

export class EntryReferenceMap extends Map<string, EntryProps | AssetProps> {}
