import type { RequestEntitiesMessage, RequestedEntitiesMessage } from '@contentful/visual-sdk';
import { PostMessageMethods as StorePostMessageMethods } from '@contentful/visual-sdk';
import type { Asset, Entry } from 'contentful';
import type { SysLink } from 'contentful-management';

import type { LIVE_PREVIEW_EDITOR_SOURCE, LIVE_PREVIEW_SDK_SOURCE } from './constants';
import { sendMessageToEditor } from './helpers';
import type { ContentType, EntityReferenceMap } from './types';

enum LivePreviewPostMessageMethods {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
  /**
   * @deprecated use `LivePreviewPostMessageMethods.CONNECTED` instead
   */
  IFRAME_CONNECTED = 'IFRAME_CONNECTED',
  TAGGED_FIELD_CLICKED = 'TAGGED_FIELD_CLICKED',
  URL_CHANGED = 'URL_CHANGED',
  SUBSCRIBED = 'SUBSCRIBED',

  ENTRY_UPDATED = 'ENTRY_UPDATED',
  ENTRY_SAVED = 'ENTRY_SAVED',
  INSPECTOR_MODE_CHANGED = 'INSPECTOR_MODE_CHANGED',
  DEBUG_MODE_ENABLED = 'DEBUG_MODE_ENABLED',

  /**
   * @deprecated use PostMessageStoreMethods instead
   */
  ENTITY_NOT_KNOWN = 'ENTITY_NOT_KNOWN',
  /**
   * @deprecated use PostMessageStoreMethods instead
   */
  UNKNOWN_REFERENCE_LOADED = 'UNKNOWN_REFERENCE_LOADED',
}

export {
  LivePreviewPostMessageMethods,
  RequestEntitiesMessage,
  RequestedEntitiesMessage,
  StorePostMessageMethods,
};
export type PostMessageMethods = LivePreviewPostMessageMethods | StorePostMessageMethods;

export type ConnectedMessage = {
  /** @deprecated use method instead */
  action: LivePreviewPostMessageMethods.IFRAME_CONNECTED | LivePreviewPostMessageMethods.CONNECTED;
  connected: true;
  locale: string;
  /** @deprecated use taggedElementCount instead */
  tags: number;
  taggedElementCount: number;
  isInspectorEnabled: boolean;
  isLiveUpdatesEnabled: boolean;
};

export type TaggedFieldClickMessage = {
  /** @deprecated use method instead */
  action: LivePreviewPostMessageMethods.TAGGED_FIELD_CLICKED;
  fieldId: string;
  entryId: string;
  locale: string;
};

/** @deprecated use RequestEntitiesMessage instead */
export type UnknownEntityMessage = {
  /** @deprecated use method instead */
  action: LivePreviewPostMessageMethods.ENTITY_NOT_KNOWN;
  referenceEntityId: string;
  referenceContentType?: string;
};

export type UrlChangedMessage = {
  /** @deprecated use method instead */
  action: LivePreviewPostMessageMethods.URL_CHANGED;
  taggedElementCount: number;
};

export type SubscribedMessage = {
  /** @deprecated use method instead */
  action: LivePreviewPostMessageMethods.SUBSCRIBED;
  type: 'GQL' | 'REST';
  entryId: string;
  locale: string;
  event: 'edit' | 'save';
  id: string;
  config: string;
};

export type ErrorMessage = {
  /** Error type */
  type: string;
  /** Error message */
  message: string;
  /** Additional information that could be helpful about this error (e.g. entryId) */
  payload: Record<string, any>;
};

export type EditorMessage =
  | ConnectedMessage
  | TaggedFieldClickMessage
  | UnknownEntityMessage
  | UrlChangedMessage
  | SubscribedMessage
  | RequestEntitiesMessage
  | ErrorMessage;

export type MessageFromSDK = EditorMessage & {
  method: PostMessageMethods;
  /** @deprecated use source instead */
  from: 'live-preview';
  source: typeof LIVE_PREVIEW_SDK_SOURCE;
  location: string;
  version: string;
};

export type EntryUpdatedMessage = {
  /** @deprecated use method instead */
  action: LivePreviewPostMessageMethods.ENTRY_UPDATED;
  method: LivePreviewPostMessageMethods.ENTRY_UPDATED;
  entity: Entry | Asset;
  contentType: ContentType;
  entityReferenceMap: EntityReferenceMap;
};

export type EntrySavedMessage = {
  method: LivePreviewPostMessageMethods.ENTRY_SAVED;
  entity: Entry | Asset;
  contentType: ContentType;
  entityReferenceMap: EntityReferenceMap;
};

/** @deprecated use RequestEntitiesMessage instead */
export type UnknownReferenceLoaded = {
  /** @deprecated use method instead */
  action: LivePreviewPostMessageMethods.UNKNOWN_REFERENCE_LOADED;
  reference: Entry | Asset;
  contentType?: SysLink;
  entityReferenceMap: EntityReferenceMap;
};

export type InspectorModeChangedMessage = {
  /** @deprecated use method instead */
  action: LivePreviewPostMessageMethods.INSPECTOR_MODE_CHANGED;
  isInspectorActive: boolean;
};

export type DebugModeEnabledMessage = {
  /** @deprecated use method instead */
  action: LivePreviewPostMessageMethods.DEBUG_MODE_ENABLED;
};

export type MessageFromEditor = (
  | EntryUpdatedMessage
  | EntrySavedMessage
  | UnknownReferenceLoaded
  | InspectorModeChangedMessage
  | DebugModeEnabledMessage
  | RequestedEntitiesMessage
) & {
  data: any;
  method: PostMessageMethods;
  /** @deprecated use source instead */
  from: 'live-preview';
  source: typeof LIVE_PREVIEW_EDITOR_SOURCE;
};

export function openEntryInEditorUtility(
  fieldId: string,
  entryId: string,
  locale: string,
  targetOrigin: string[]
): void {
  sendMessageToEditor(
    LivePreviewPostMessageMethods.TAGGED_FIELD_CLICKED,
    {
      action: LivePreviewPostMessageMethods.TAGGED_FIELD_CLICKED,
      fieldId,
      entryId,
      locale,
    },
    targetOrigin
  );
}
