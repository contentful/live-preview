import type { Asset, Entry } from 'contentful';

import type { LIVE_PREVIEW_EDITOR_SOURCE, LIVE_PREVIEW_SDK_SOURCE } from './constants.js';
import { sendMessageToEditor } from './helpers/index.js';
import {
  InspectorModeEventMethods,
  type InspectorModeAssetAttributes,
  type InspectorModeAttributes,
  type InspectorModeChangedMessage,
  type InspectorModeEntryAttributes,
  type InspectorModeMouseMoveMessage,
  type InspectorModeResizeMessage,
  type InspectorModeScrollMessage,
  type InspectorModeTaggedElementsMessage,
} from './inspectorMode/types.js';
import type { Argument, ContentType } from './types.js';

enum LivePreviewPostMessageMethods {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
  TAGGED_FIELD_CLICKED = 'TAGGED_FIELD_CLICKED',
  URL_CHANGED = 'URL_CHANGED',
  SUBSCRIBED = 'SUBSCRIBED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',

  ENTRY_UPDATED = 'ENTRY_UPDATED',
  ENTRY_SAVED = 'ENTRY_SAVED',
  DEBUG_MODE_ENABLED = 'DEBUG_MODE_ENABLED',
}

export { InspectorModeChangedMessage, InspectorModeEventMethods, LivePreviewPostMessageMethods };

export type PostMessageMethods = LivePreviewPostMessageMethods | InspectorModeEventMethods;

export type ConnectedMessage = {
  connected: true;
  locale: string;
  taggedElementCount: number;
  automaticallyTaggedElementCount: number;
  manuallyTaggedElementCount: number;
  isInspectorEnabled: boolean;
  isLiveUpdatesEnabled: boolean;
  hideCoveredElementOutlines?: boolean;
  version: string;
};

export type TaggedFieldClickMessage = InspectorModeAttributes;

export type UrlChangedMessage = {
  taggedElementCount: number;
};

export type SubscribedMessage = {
  /** @deprecated */
  type?: 'GQL' | 'REST';
  /** @deprecated */
  sysIds?: string[];
  /** @deprecated use sysIds instead */
  entryId?: string;
  locale: string;
  event: 'edit' | 'save';
  id: string;
  config: string;
};

export type UnsubscribedMessage = {
  type: 'GQL' | 'REST';
  sysIds: string[];
  /** @deprecated use sysIds instead */
  entryId?: string;
  locale: string;
  event: 'edit' | 'save';
  id: string;
  config: string;
};

export type EditorMessage =
  | ConnectedMessage
  | TaggedFieldClickMessage
  | UrlChangedMessage
  | SubscribedMessage
  | UnsubscribedMessage
  | InspectorModeMouseMoveMessage
  | InspectorModeScrollMessage
  | InspectorModeResizeMessage
  | InspectorModeTaggedElementsMessage;

export type MessageFromSDK = EditorMessage & {
  method: PostMessageMethods;
  source: typeof LIVE_PREVIEW_SDK_SOURCE;
  location: string;
  version: string;
};

export type EntryUpdatedMessage = {
  method: LivePreviewPostMessageMethods.ENTRY_UPDATED;
  data: Entry | Asset;
  contentType: ContentType;
  subscriptionId: string;
};

export type EntrySavedMessage = {
  method: LivePreviewPostMessageMethods.ENTRY_SAVED;
  entity: Entry | Asset;
  contentType: ContentType;
};

export type MessageFromEditor = (
  | EntryUpdatedMessage
  | EntrySavedMessage
  | InspectorModeChangedMessage
) & {
  data: Argument;
  method: PostMessageMethods;
  source: typeof LIVE_PREVIEW_EDITOR_SOURCE;
};

export function openEntryInEditorUtility(
  props: InspectorModeEntryAttributes,
  targetOrigin: string[],
): void {
  sendMessageToEditor(
    LivePreviewPostMessageMethods.TAGGED_FIELD_CLICKED,
    {
      action: LivePreviewPostMessageMethods.TAGGED_FIELD_CLICKED,
      ...props,
    } as TaggedFieldClickMessage,
    targetOrigin,
  );
}

export function openAssetInEditorUtility(
  props: InspectorModeAssetAttributes,
  targetOrigin: string[],
): void {
  sendMessageToEditor(
    LivePreviewPostMessageMethods.TAGGED_FIELD_CLICKED,
    {
      action: LivePreviewPostMessageMethods.TAGGED_FIELD_CLICKED,
      ...props,
    } as TaggedFieldClickMessage,
    targetOrigin,
  );
}
