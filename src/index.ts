import './styles.css';

import { FieldTagging } from './fieldTagging';
import {
  sendMessageToEditor,
  pollUrlChanges,
  setDebugMode,
  debug,
  isInsideIframe,
} from './helpers';
import { LiveUpdates } from './liveUpdates';
import { Argument, LivePreviewProps, SubscribeCallback, TagAttributes } from './types';

interface ContentfulLivePreviewInitConfig {
  debugMode?: boolean;
  enableInspectorMode?: boolean;
  enableLiveUpdates?: boolean;
}

export class ContentfulLivePreview {
  static initialized = false;
  static inspectorMode: FieldTagging | null = null;
  static liveUpdates: LiveUpdates | null = null;
  static inspectorModeEnabled = true;
  static liveUpdatesEnabled = true;

  // Static method to initialize the LivePreview SDK
  static init({
    debugMode,
    enableInspectorMode,
    enableLiveUpdates,
  }: ContentfulLivePreviewInitConfig = {}): Promise<FieldTagging | null> | undefined {
    // Check if running in a browser environment
    if (typeof window !== 'undefined') {
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

      if (ContentfulLivePreview.initialized) {
        debug.log('You have already initialized the Live Preview SDK.');
        return Promise.resolve(ContentfulLivePreview.inspectorMode);
      }

      if (!isInsideIframe()) {
        // If the SDK is used outside of the LivePreviewIframe it should do nothing
        return Promise.resolve(null);
      }

      if (this.inspectorModeEnabled) {
        ContentfulLivePreview.inspectorMode = new FieldTagging();
      }

      if (this.liveUpdatesEnabled) {
        ContentfulLivePreview.liveUpdates = new LiveUpdates();
      }

      window.addEventListener('message', (event) => {
        if (typeof event.data !== 'object' || !event.data) return;
        if (event.data.from !== 'live-preview') return;

        if (this.inspectorModeEnabled) {
          ContentfulLivePreview.inspectorMode?.receiveMessage(event.data);
        }

        if (this.liveUpdatesEnabled) {
          ContentfulLivePreview.liveUpdates?.receiveMessage(event.data);
        }
      });

      pollUrlChanges(() => {
        sendMessageToEditor({ action: 'URL_CHANGED' });
      });

      sendMessageToEditor({
        action: 'IFRAME_CONNECTED',
        connected: true,
        tags: document.querySelectorAll(`[${TagAttributes.ENTRY_ID}]`).length,
      });

      this.initialized = true;

      return Promise.resolve(ContentfulLivePreview.inspectorMode);
    }
  }

  static subscribe(data: Argument, locale: string, callback: SubscribeCallback): VoidFunction {
    if (!this.liveUpdatesEnabled) {
      return () => {
        /* noop */
      };
    }

    if (!this.liveUpdates) {
      throw new Error(
        'Live Updates are not initialized, please call `ContentfulLivePreview.init()` first.'
      );
    }

    return this.liveUpdates.subscribe(data, locale, callback);
  }

  // Static method to render live preview data-attributes to HTML element output
  static getProps({
    fieldId,
    entryId,
    locale,
  }: LivePreviewProps): Record<TagAttributes, string | null | undefined> | null {
    if (!this.inspectorModeEnabled) {
      return null;
    }

    if (!fieldId || !entryId || !locale) {
      debug.warn('Missing property for inspector mode', { fieldId, entryId, locale });
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
}
