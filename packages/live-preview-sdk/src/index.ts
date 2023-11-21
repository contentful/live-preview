import './styles.css';

import { type DocumentNode } from 'graphql';

import { version } from '../package.json';
import {
  sendMessageToEditor,
  pollUrlChanges,
  setDebugMode,
  debug,
  isInsideIframe,
} from './helpers';
import { isValidMessage } from './helpers/validateMessage';
import { InspectorMode } from './inspectorMode';
import { type InspectorModeTags, InspectorModeDataAttributes } from './inspectorMode/types';
import { getAllTaggedEntries } from './inspectorMode/utils';
import { LiveUpdates } from './liveUpdates';
import {
  type ConnectedMessage,
  type EditorMessage,
  type MessageFromEditor,
  type PostMessageMethods,
  type UrlChangedMessage,
  LivePreviewPostMessageMethods,
  openEntryInEditorUtility,
} from './messages';
import { SaveEvent } from './saveEvent';
import type { Argument, LivePreviewProps, SubscribeCallback } from './types';

export const VERSION = version;

const DEFAULT_ORIGINS = ['https://app.contentful.com', 'https://app.eu.contentful.com'];

export interface ContentfulLivePreviewInitConfig {
  locale: string;
  debugMode?: boolean;
  enableInspectorMode?: boolean;
  enableLiveUpdates?: boolean;
  /**
   * Contentful host in which the website should be shown
   * Can be `https://app.contentful.com` or `https://app.eu.contentful.com`
   */
  targetOrigin?: string | string[];
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
  static sendMessage: (method: PostMessageMethods, data: EditorMessage) => void;
  static targetOrigin: string[];

  // Static method to initialize the LivePreview SDK
  static init(config: ContentfulLivePreviewInitConfig): Promise<InspectorMode | null> | undefined {
    if (typeof config !== 'object' || !config?.locale) {
      throw new Error(
        "Init function have to be called with a locale configuration (for example: `ContentfulLivePreview.init({ locale: 'en-US'})`)"
      );
    }

    const {
      debugMode,
      enableInspectorMode,
      enableLiveUpdates,
      locale,
      targetOrigin = DEFAULT_ORIGINS,
    } = config;

    // Check if running in a browser environment
    if (typeof window !== 'undefined') {
      // if (!isInsideIframe()) {
      //   // If the SDK is used outside of the LivePreviewIframe it should do nothing
      //   this.liveUpdatesEnabled = false;

      //   return Promise.resolve(null);
      // }

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

      this.targetOrigin = Array.isArray(targetOrigin) ? targetOrigin : [targetOrigin];

      if (this.initialized) {
        debug.log('You have already initialized the Live Preview SDK.');
        return Promise.resolve(ContentfulLivePreview.inspectorMode);
      }

      // setup the live preview plugins (inspectorMode and liveUpdates)
      if (this.inspectorModeEnabled) {
        this.inspectorMode = new InspectorMode({ locale, targetOrigin: this.targetOrigin });
      }

      if (this.liveUpdatesEnabled) {
        this.liveUpdates = new LiveUpdates({ locale, targetOrigin: this.targetOrigin });
        this.saveEvent = new SaveEvent({ locale });
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
          this.inspectorMode?.receiveMessage(event.data);
        }

        if (this.liveUpdatesEnabled) {
          this.liveUpdates?.receiveMessage(event.data);
          this.saveEvent?.receiveMessage(event.data);
        }
      });

      const _this = this;

      document.addEventListener('live-preview-receive-message', function (eventData: any) {
        const event = {
          data: eventData.detail.message,
        } as MessageEvent<MessageFromEditor>;
        console.log({
          event,
          eventData,
          isvalid: isValidMessage(event),
        });

        if (!isValidMessage(event)) {
          return;
        }

        console.log('post message received from editor', {
          event,
        });
        debug.log('Received message', event.data);

        if (
          ('action' in event.data && event.data.action === 'DEBUG_MODE_ENABLED') ||
          event.data.method === LivePreviewPostMessageMethods.DEBUG_MODE_ENABLED
        ) {
          setDebugMode(true);
          return;
        }

        if (_this.inspectorModeEnabled) {
          _this.inspectorMode?.receiveMessage(event.data);
        }

        if (_this.liveUpdatesEnabled) {
          _this.liveUpdates?.receiveMessage(event.data);
          _this.saveEvent?.receiveMessage(event.data);
        }
      });

      // navigation changes
      pollUrlChanges(() => {
        sendMessageToEditor(
          LivePreviewPostMessageMethods.URL_CHANGED,
          {
            action: LivePreviewPostMessageMethods.URL_CHANGED,
            taggedElementCount: document.querySelectorAll(
              `[${InspectorModeDataAttributes.ENTRY_ID}]`
            ).length,
          } as UrlChangedMessage,
          this.targetOrigin
        );
      });

      // tell the editor that there's a SDK
      const taggedElementCount = document.querySelectorAll(
        `[${InspectorModeDataAttributes.ENTRY_ID}]`
      ).length;
      sendMessageToEditor(
        LivePreviewPostMessageMethods.CONNECTED,
        {
          action: LivePreviewPostMessageMethods.CONNECTED,
          connected: true,
          tags: taggedElementCount,
          taggedElementCount,
          locale: this.locale,
          isInspectorEnabled: this.inspectorModeEnabled,
          isLiveUpdatesEnabled: this.liveUpdatesEnabled,
        } as ConnectedMessage,
        this.targetOrigin
      );

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
      [InspectorModeDataAttributes.FIELD_ID]: fieldId,
      [InspectorModeDataAttributes.ENTRY_ID]: entryId,
      [InspectorModeDataAttributes.LOCALE]: locale,
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

    openEntryInEditorUtility(fieldId, entryId, locale || this.locale, this.targetOrigin);
  }

  /**
   * Returns a list of tagged entries on the page
   */
  static getEntryList(): string[] {
    return getAllTaggedEntries();
  }
}

export { LIVE_PREVIEW_EDITOR_SOURCE, LIVE_PREVIEW_SDK_SOURCE } from './constants';
export * from './messages';
