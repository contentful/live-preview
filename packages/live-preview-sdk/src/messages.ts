import type { Asset, Entry } from 'contentful';
import type { SysLink } from 'contentful-management';

import type { LIVE_PREVIEW_EDITOR_SOURCE, LIVE_PREVIEW_SDK_SOURCE } from './constants';
import { sendMessageToEditor } from './helpers';
import {
  InspectorModeEventMethods,
  type InspectorModeAttributes,
  type InspectorModeChangedMessage,
  type InspectorModeMouseMoveMessage,
  type InspectorModeResizeMessage,
  type InspectorModeScrollMessage,
  type InspectorModeTaggedElementsMessage,
} from './inspectorMode/types';
import type { Argument, ContentType, EntityReferenceMap } from './types';

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
  UNSUBSCRIBED = 'UNSUBSCRIBED',

  ENTRY_UPDATED = 'ENTRY_UPDATED',
  ENTRY_SAVED = 'ENTRY_SAVED',
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

export { InspectorModeChangedMessage, InspectorModeEventMethods, LivePreviewPostMessageMethods };

export type PostMessageMethods = LivePreviewPostMessageMethods | InspectorModeEventMethods;

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
} & InspectorModeAttributes;

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
  sysIds: string[];
  locale: string;
  event: 'edit' | 'save';
  id: string;
  config: string;
};

export type UnsubscribedMessage = {
  type: 'GQL' | 'REST';
  sysIds: string[];
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
  payload: Record<string, unknown>;
};

export type EditorMessage =
  | ConnectedMessage
  | TaggedFieldClickMessage
  | UnknownEntityMessage
  | UrlChangedMessage
  | SubscribedMessage
  | UnsubscribedMessage
  | ErrorMessage
  | InspectorModeMouseMoveMessage
  | InspectorModeScrollMessage
  | InspectorModeResizeMessage
  | InspectorModeTaggedElementsMessage;

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
  data: Entry | Asset;
  contentType: ContentType;
  entityId: string;
};

export type EntrySavedMessage = {
  method: LivePreviewPostMessageMethods.ENTRY_SAVED;
  entity: Entry | Asset;
  contentType: ContentType;
};

/** @deprecated use RequestEntitiesMessage instead */
export type UnknownReferenceLoaded = {
  /** @deprecated use method instead */
  action: LivePreviewPostMessageMethods.UNKNOWN_REFERENCE_LOADED;
  reference: Entry | Asset;
  contentType?: SysLink;
  entityReferenceMap: EntityReferenceMap;
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
) & {
  data: Argument;
  method: PostMessageMethods;
  /** @deprecated use source instead */
  from: 'live-preview';
  source: typeof LIVE_PREVIEW_EDITOR_SOURCE;
};

export function openEntryInEditorUtility(
  fieldId: string,
  entryId: string,
  locale: string,
  targetOrigin: string[],
): void {
  sendMessageToEditor(
    LivePreviewPostMessageMethods.TAGGED_FIELD_CLICKED,
    {
      action: LivePreviewPostMessageMethods.TAGGED_FIELD_CLICKED,
      fieldId,
      entryId,
      locale,
    },
    targetOrigin,
  );
}

export function openAssetInEditorUtility(
  fieldId: string,
  assetId: string,
  locale: string,
  targetOrigin: string[],
): void {
  sendMessageToEditor(
    LivePreviewPostMessageMethods.TAGGED_FIELD_CLICKED,
    {
      action: LivePreviewPostMessageMethods.TAGGED_FIELD_CLICKED,
      fieldId,
      assetId,
      locale,
    },
    targetOrigin,
  );
}
