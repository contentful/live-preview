import {
  encodeGraphQLResponse,
  encodeCPAResponse,
  splitEncoding,
} from '@contentful/content-source-maps';
import { type DocumentNode } from 'graphql';

import { version } from '../package.json';
import {
  debug,
  isInsideIframe,
  pollUrlChanges,
  sendMessageToEditor,
  setDebugMode,
} from './helpers/index.js';
import { isValidMessage } from './helpers/validateMessage.js';
import { InspectorMode } from './inspectorMode/index.js';
import { InspectorModeDataAttributes, type InspectorModeTags } from './inspectorMode/types.js';
import { getAllTaggedEntries } from './inspectorMode/utils.js';
import { LiveUpdates } from './liveUpdates.js';
import {
  LivePreviewPostMessageMethods,
  openAssetInEditorUtility,
  openEntryInEditorUtility,
  type ConnectedMessage,
  type EditorMessage,
  type MessageFromEditor,
  type PostMessageMethods,
  type UrlChangedMessage,
} from './messages.js';
import { SaveEvent } from './saveEvent.js';
import type {
  Argument,
  LivePreviewAssetProps,
  LivePreviewEntryProps,
  LivePreviewProps,
  SubscribeCallback,
} from './types.js';

export type { LivePreviewAssetProps, LivePreviewEntryProps, LivePreviewProps };

export const VERSION = version;

const DEFAULT_ORIGINS = [
  'https://app.contentful.com',
  'https://app.eu.contentful.com',
  'http://localhost:3001', // for local debugging for Contentful engineers
];

export interface ContentfulLivePreviewInitConfig {
  locale: string;
  /** Id of the contentful space */
  space?: string;
  /** Id of the contentful environment */
  environment?: string;

  debugMode?: boolean;
  enableInspectorMode?: boolean;
  enableLiveUpdates?: boolean;
  /**
   * Contentful host in which the website should be shown
   * Can be `https://app.contentful.com` or `https://app.eu.contentful.com`
   */
  targetOrigin?: string | string[];

  experimental?: {
    ignoreManuallyTaggedElements?: boolean;
  };
}

export interface ContentfulSubscribeConfig {
  data: Argument;
  locale?: string;
  callback: SubscribeCallback;
  query?: DocumentNode | string;
}

export class ContentfulLivePreview {
  static initialized = false;
  static inspectorMode: InspectorMode | null = null;
  static liveUpdates: LiveUpdates | null = null;
  static saveEvent: SaveEvent | null = null;
  static inspectorModeEnabled = true;
  static liveUpdatesEnabled = true;
  static locale: string;
  static space?: string;
  static environment?: string;
  static sendMessage: (method: PostMessageMethods, data: EditorMessage) => void;
  static targetOrigin: string[];

  // Static method to initialize the LivePreview SDK
  static init(config: ContentfulLivePreviewInitConfig): Promise<InspectorMode | null> | undefined {
    if (typeof config !== 'object' || !config?.locale) {
      throw new Error(
        "Init function have to be called with a locale configuration (for example: `ContentfulLivePreview.init({ locale: 'en-US'})`)",
      );
    }

    const {
      debugMode,
      enableInspectorMode,
      enableLiveUpdates,
      locale,
      environment,
      space,
      targetOrigin,
    } = config;

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
      this.space = space;
      this.environment = environment;

      if (targetOrigin) {
        this.targetOrigin = Array.isArray(targetOrigin) ? targetOrigin : [targetOrigin];
      } else {
        const ancestorOrigins = window.location.ancestorOrigins;
        const currentDefaultOrigin = ancestorOrigins
          ? DEFAULT_ORIGINS.find((origin) => ancestorOrigins.contains(origin))
          : //less consistent workaround for Firefox, where ancestorOrigins is not supported
            DEFAULT_ORIGINS.find((origin) => document.referrer.includes(origin));
        console.log(
          'hey2',
          window.location.ancestorOrigins,
          document.referrer,
          currentDefaultOrigin,
        );
        if (!currentDefaultOrigin) {
          throw new Error(
            `The current origin is not supported. Please provide a targetOrigin in the live preview configuration.`,
          );
        }
        this.targetOrigin = [currentDefaultOrigin];
      }

      if (this.initialized) {
        debug.log('You have already initialized the Live Preview SDK.');
        return Promise.resolve(ContentfulLivePreview.inspectorMode);
      }

      // setup the live preview plugins (inspectorMode and liveUpdates)
      if (this.inspectorModeEnabled) {
        this.inspectorMode = new InspectorMode({
          locale,
          space,
          environment,
          targetOrigin: this.targetOrigin,
          ignoreManuallyTaggedElements: config.experimental?.ignoreManuallyTaggedElements,
        });
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

        if (event.data.method === LivePreviewPostMessageMethods.DEBUG_MODE_ENABLED) {
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

      // navigation changes
      pollUrlChanges(() => {
        sendMessageToEditor(
          LivePreviewPostMessageMethods.URL_CHANGED,
          {
            action: LivePreviewPostMessageMethods.URL_CHANGED,
            taggedElementCount: document.querySelectorAll(
              `[${InspectorModeDataAttributes.ENTRY_ID}]`,
            ).length,
          } as UrlChangedMessage,
          this.targetOrigin,
        );
      });

      // tell the editor that there's a SDK
      const taggedElementCount = document.querySelectorAll(
        `[${InspectorModeDataAttributes.ENTRY_ID}]`,
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
        this.targetOrigin,
      );

      // all set up - ready to go
      this.initialized = true;

      return Promise.resolve(ContentfulLivePreview.inspectorMode);
    }
  }

  static subscribe(config: ContentfulSubscribeConfig): VoidFunction;
  static subscribe(
    event: 'save',
    config: Pick<ContentfulSubscribeConfig, 'callback'>,
  ): VoidFunction;
  static subscribe(event: 'edit', config: ContentfulSubscribeConfig): VoidFunction;
  static subscribe(
    configOrEvent: 'save' | 'edit' | ContentfulSubscribeConfig,
    config?: ContentfulSubscribeConfig | Pick<ContentfulSubscribeConfig, 'callback'>,
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
          'Save event is not initialized, please call `ContentfulLivePreview.init()` first.',
        );
      }
      return this.saveEvent.subscribe(subscribeConfig.callback);
    }

    if (!this.liveUpdates) {
      throw new Error(
        'Live updates are not initialized, please call `ContentfulLivePreview.init()` first.',
      );
    }

    return this.liveUpdates.subscribe(subscribeConfig as ContentfulSubscribeConfig);
  }

  // Static method to render live preview data-attributes to HTML element output
  static getProps(props: LivePreviewProps): InspectorModeTags {
    const { fieldId, locale, environment, space } = props;

    if (!this.inspectorModeEnabled) {
      return null;
    }

    if (fieldId) {
      const sharedProps = {
        ...(locale ? { [InspectorModeDataAttributes.LOCALE]: locale } : {}),
        ...(environment ? { [InspectorModeDataAttributes.ENVIRONMENT]: environment } : {}),
        ...(space ? { [InspectorModeDataAttributes.SPACE]: space } : {}),
        [InspectorModeDataAttributes.FIELD_ID]: fieldId,
      };

      if (locale) {
        sharedProps[InspectorModeDataAttributes.LOCALE] = locale;
      }

      if ((props as LivePreviewAssetProps).assetId !== undefined) {
        return {
          ...sharedProps,
          [InspectorModeDataAttributes.ASSET_ID]: (props as LivePreviewAssetProps).assetId,
        };
      }

      if ((props as LivePreviewEntryProps).entryId !== undefined) {
        return {
          ...sharedProps,
          [InspectorModeDataAttributes.ENTRY_ID]: (props as LivePreviewEntryProps).entryId,
        };
      }
    }

    debug.warn('Missing property for inspector mode', { ...props });
    return null;
  }

  static toggleInspectorMode(): boolean {
    this.inspectorModeEnabled = !this.inspectorModeEnabled;
    return this.inspectorModeEnabled;
  }

  static toggleLiveUpdatesMode(): boolean {
    this.liveUpdatesEnabled = !this.liveUpdatesEnabled;
    return this.liveUpdatesEnabled;
  }

  static openEntryInEditor(props: LivePreviewProps): void {
    const defaultProps = {
      locale: this.locale,
      environment: this.environment,
      space: this.space,
    };

    if ((props as LivePreviewAssetProps).assetId !== undefined && props.fieldId) {
      openAssetInEditorUtility(
        {
          ...defaultProps,
          ...(props as LivePreviewAssetProps),
        },
        this.targetOrigin,
      );
      return;
    }

    if ((props as LivePreviewEntryProps).entryId !== undefined && props.fieldId) {
      openEntryInEditorUtility(
        {
          ...defaultProps,
          ...(props as LivePreviewEntryProps),
        },
        this.targetOrigin,
      );
      return;
    }

    debug.error('Please provide field id and entry id to openEntryInEditor.');
  }

  /**
   * Returns a list of tagged entries on the page
   */
  static getEntryList(): string[] {
    return getAllTaggedEntries();
  }
}

export { LIVE_PREVIEW_EDITOR_SOURCE, LIVE_PREVIEW_SDK_SOURCE } from './constants.js';

export * from './messages.js';
export { encodeGraphQLResponse, encodeCPAResponse, splitEncoding };
