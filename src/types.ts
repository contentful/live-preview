import type { AssetProps, EntryProps, ContentTypeProps } from 'contentful-management';

export type ContentType = ContentTypeProps;
export const ASSET_TYPENAME = 'Asset';

export type LivePreviewProps = {
  fieldId: string;
  entryId: string;
  locale?: string;
};

export const enum TagAttributes {
  FIELD_ID = 'data-contentful-field-id',
  ENTRY_ID = 'data-contentful-entry-id',
  LOCALE = 'data-contentful-locale',
}

export type InspectorModeTags = {
  [TagAttributes.ENTRY_ID]: string;
  [TagAttributes.FIELD_ID]: string;
  [TagAttributes.LOCALE]?: string;
} | null;

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

type SubscribedMessage = {
  action: 'SUBSCRIBED';
  type: 'GQL' | 'REST';
};

export class EntityReferenceMap extends Map<string, EntryProps | AssetProps> {}

export type EditorMessage =
  | IframeConnectedMessage
  | TaggedFieldClickMessage
  | UnknownEntityMessage
  | UrlChangedMessage
  | SubscribedMessage;

export type MessageFromSDK = EditorMessage & {
  from: 'live-preview';
  location: string;
  version: string;
};

export type EntryUpdatedMessage = {
  action: 'ENTRY_UPDATED';
  entity: EntryProps | AssetProps;
  contentType: ContentType;
  entityReferenceMap: EntityReferenceMap;
};

type UnknownReferenceLoaded = {
  action: 'UNKNOWN_REFERENCE_LOADED';
  reference: EntryProps | AssetProps;
  contentType?: ContentType;
  entityReferenceMap: EntityReferenceMap;
};

type InspectorModeChanged = { action: 'INSPECTOR_MODE_CHANGED'; isInspectorActive: boolean };

export type MessageFromEditor = (
  | EntryUpdatedMessage
  | UnknownReferenceLoaded
  | InspectorModeChanged
) & {
  from: 'live-preview';
};

export type UpdateEntryProps = {
  contentType: ContentType;
  dataFromPreviewApp: Entity & { sys: SysProps };
  updateFromEntryEditor: EntryProps;
  locale: string;
  entityReferenceMap: EntityReferenceMap;
};

export type UpdateFieldProps = {
  dataFromPreviewApp: Entity;
  updateFromEntryEditor: EntryProps;
  name: string;
  locale: string;
  entityReferenceMap?: EntityReferenceMap;
};

export type UpdateReferenceFieldProps = {
  referenceFromPreviewApp: (EntryProps & { __typename?: string }) | null | undefined;
  updatedReference: Entity & CollectionItem;
  entityReferenceMap: EntityReferenceMap;
  locale: string;
};

export interface Subscription {
  data: Argument;
  locale?: string;
  callback: SubscribeCallback;
}
