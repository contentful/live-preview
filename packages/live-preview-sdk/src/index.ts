import './styles.css';

import { type DocumentNode } from 'graphql';

import {
  sendMessageToEditor,
  pollUrlChanges,
  setDebugMode,
  debug,
  isInsideIframe,
} from './helpers';
import { isValidMessage } from './helpers/validateMessage';
import { InspectorMode } from './inspectorMode';
import { LiveUpdates } from './liveUpdates';
import {
  ConnectedMessage,
  LivePreviewPostMessageMethods,
  MessageFromEditor,
  UrlChangedMessage,
  openEntryInEditorUtility,
} from './messages';
import {
  Argument,
  InspectorModeTags,
  LivePreviewProps,
  SubscribeCallback,
  TagAttributes,
} from './types';
import { getEntryList } from './utils';
import { SaveEvent } from './saveEvent';

export interface ContentfulLivePreviewInitConfig {
  locale: string;
  debugMode?: boolean;
  enableInspectorMode?: boolean;
  enableLiveUpdates?: boolean;
}

export interface ContentfulSubscribeConfig {
  data: Argument;
  locale?: string;
  callback: SubscribeCallback;
  query?: DocumentNode;
}

export class ContentfulLivePreview {
  static initialized = false;
  static inspectorMode: InspectorMode | null = null;
  static liveUpdates: LiveUpdates | null = null;
  static saveEvent: SaveEvent | null = null;
  static inspectorModeEnabled = true;
  static liveUpdatesEnabled = true;
  static locale: string;

  // Static method to initialize the LivePreview SDK
  static init(config: ContentfulLivePreviewInitConfig): Promise<InspectorMode | null> | undefined {
    if (typeof config !== 'object' || !config?.locale) {
      throw new Error(
        "Init function have to be called with a locale configuration (for example: `ContentfulLivePreview.init({ locale: 'en-US'})`)"
      );
    }

    const { debugMode, enableInspectorMode, enableLiveUpdates, locale } = config;

    // Check if running in a browser environment
    if (typeof window !== 'undefined') {
      if (!isInsideIframe()) {
        // If the SDK is used outside of the LivePreviewIframe it should do nothing
        this.liveUpdatesEnabled = false;

        return Promise.resolve(null);
      }

      if (debugMode) {
        setDebugMode(debugMode);
      }

      // toggle inspector mode based on flag
      if (typeof enableInspectorMode === 'boolean') {
        this.inspectorModeEnabled = enableInspectorMode;
      }

      // toggle live updates based on flag
      if (typeof enableLiveUpdates === 'boolean') {
        this.liveUpdatesEnabled = enableLiveUpdates;
      }

      this.locale = locale;

      if (ContentfulLivePreview.initialized) {
        debug.log('You have already initialized the Live Preview SDK.');
        return Promise.resolve(ContentfulLivePreview.inspectorMode);
      }

      // setup the live preview plugins (inspectorMode and liveUpdates)
      if (this.inspectorModeEnabled) {
        ContentfulLivePreview.inspectorMode = new InspectorMode({ locale });
      }

      if (this.liveUpdatesEnabled) {
        ContentfulLivePreview.liveUpdates = new LiveUpdates({ locale });
        ContentfulLivePreview.saveEvent = new SaveEvent({ locale });
      }

      // bind event listeners for interactivity
      window.addEventListener('message', (event: MessageEvent<MessageFromEditor>) => {
        if (!isValidMessage(event)) {
          return;
        }

        debug.log('Received message', event.data);

        if (
          ('action' in event.data && event.data.action === 'DEBUG_MODE_ENABLED') ||
          event.data.method === LivePreviewPostMessageMethods.DEBUG_MODE_ENABLED
        ) {
          setDebugMode(true);
          return;
        }

        if (this.inspectorModeEnabled) {
          ContentfulLivePreview.inspectorMode?.receiveMessage(event.data);
        }

        if (this.liveUpdatesEnabled) {
          ContentfulLivePreview.liveUpdates?.receiveMessage(event.data);
        }
      });

      // navigation changes
      pollUrlChanges(() => {
        sendMessageToEditor(LivePreviewPostMessageMethods.URL_CHANGED, {
          action: LivePreviewPostMessageMethods.URL_CHANGED,
          taggedElementCount: document.querySelectorAll(`[${TagAttributes.ENTRY_ID}]`).length,
        } as UrlChangedMessage);
      });

      // tell the editor that there's a SDK
      const taggedElementCount = document.querySelectorAll(`[${TagAttributes.ENTRY_ID}]`).length;
      sendMessageToEditor(LivePreviewPostMessageMethods.CONNECTED, {
        action: LivePreviewPostMessageMethods.CONNECTED,
        connected: true,
        tags: taggedElementCount,
        taggedElementCount,
        locale: this.locale,
        isInspectorEnabled: this.inspectorModeEnabled,
        isLiveUpdatesEnabled: this.liveUpdatesEnabled,
      } as ConnectedMessage);

      // all set up - ready to go
      this.initialized = true;

      return Promise.resolve(ContentfulLivePreview.inspectorMode);
    }
  }

  static subscribe(config: ContentfulSubscribeConfig): VoidFunction;
  static subscribe(
    event: 'save',
    config: Pick<ContentfulSubscribeConfig, 'callback'>
  ): VoidFunction;
  static subscribe(event: 'edit', config: ContentfulSubscribeConfig): VoidFunction;
  static subscribe(
    configOrEvent: 'save' | 'edit' | ContentfulSubscribeConfig,
    config?: ContentfulSubscribeConfig | Pick<ContentfulSubscribeConfig, 'callback'>
  ): VoidFunction {
    if (!this.liveUpdatesEnabled) {
      return () => {
        /* noop */
      };
    }

    const event = typeof configOrEvent === 'string' ? configOrEvent : 'edit';
    const subscribeConfig = typeof configOrEvent === 'object' ? configOrEvent : config!;

    if (event === 'save') {
      if (!this.saveEvent) {
        throw new Error(
          'Save event is not initialized, please call `ContentfulLivePreview.init()` first.'
        );
      }
      return this.saveEvent.subscribe(subscribeConfig.callback);
    }

    if (!this.liveUpdates) {
      throw new Error(
        'Live updates are not initialized, please call `ContentfulLivePreview.init()` first.'
      );
    }

    return this.liveUpdates.subscribe(subscribeConfig as ContentfulSubscribeConfig);
  }

  // Static method to render live preview data-attributes to HTML element output
  static getProps({ fieldId, entryId, locale }: LivePreviewProps): InspectorModeTags {
    if (!this.inspectorModeEnabled) {
      return null;
    }

    if (!fieldId || !entryId) {
      debug.warn('Missing property for inspector mode', { fieldId, entryId });
      return null;
    }

    return {
      [TagAttributes.FIELD_ID]: fieldId,
      [TagAttributes.ENTRY_ID]: entryId,
      [TagAttributes.LOCALE]: locale,
    };
  }

  static toggleInspectorMode(): boolean {
    this.inspectorModeEnabled = !this.inspectorModeEnabled;
    return this.inspectorModeEnabled;
  }

  static toggleLiveUpdatesMode(): boolean {
    this.liveUpdatesEnabled = !this.liveUpdatesEnabled;
    return this.liveUpdatesEnabled;
  }

  static openEntryInEditor({ fieldId, entryId, locale }: LivePreviewProps): void {
    if (!fieldId || !entryId) {
      debug.error('Please provide field id and entry id to openEntryInEditor.');
    }

    openEntryInEditorUtility(fieldId, entryId, locale || this.locale);
  }

  /**
   * Returns a list of tagged entries on the page
   */
  static getEntryList(): string[] {
    return getEntryList();
  }
}

export { LIVE_PREVIEW_EDITOR_SOURCE, LIVE_PREVIEW_SDK_SOURCE } from './constants';
export * from './messages';
