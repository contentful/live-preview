import './styles.css';

import { FieldTagging } from './fieldTagging';
import { sendMessageToEditor, pollUrlChanges, setDebugMode, debug } from './helpers';
import { LiveUpdates } from './liveUpdates';
import { Argument, LivePreviewProps, SubscribeCallback, TagAttributes } from './types';

interface ContentfulLivePreviewInitConfig {
  debugMode?: boolean;
  enableFieldTagging?: boolean;
  enableLiveUpdates?: boolean;
}

export class ContentfulLivePreview {
  static fieldTagging: FieldTagging | null = null;
  static liveUpdates: LiveUpdates | null = null;
  static fieldTaggingEnabled = true;
  static liveUpdatesEnabled = true;

  // Static method to initialize the LivePreview SDK
  static init(
    { debugMode, enableFieldTagging, enableLiveUpdates }: ContentfulLivePreviewInitConfig = {
      enableFieldTagging: ContentfulLivePreview.fieldTaggingEnabled,
      enableLiveUpdates: ContentfulLivePreview.liveUpdatesEnabled,
      debugMode: false,
    }
  ): Promise<FieldTagging | null> | undefined {
    // Check if running in a browser environment
    if (typeof window !== 'undefined') {
      if (debugMode) {
        setDebugMode(debugMode);
      }

      // toggle inspector mode based on flag
      if (!enableFieldTagging) {
        this.togglefieldTagging();
      }

      // toggle live updates based on flag
      if (!enableLiveUpdates) {
        this.toggleLiveUpdatesMode();
      }

      if (ContentfulLivePreview.fieldTagging) {
        // disable field tagging if user specified in config
        if (!ContentfulLivePreview.fieldTaggingEnabled) {
          return Promise.resolve(null);
        }
        debug.log('You have already initialized the Live Preview SDK.');
        return Promise.resolve(ContentfulLivePreview.fieldTagging);
      } else {
        this.setupFieldTagging();
        this.setupLiveUpdates();

        pollUrlChanges(() => {
          sendMessageToEditor({ action: 'URL_CHANGED' });
        });

        sendMessageToEditor({
          action: 'IFRAME_CONNECTED',
          connected: true,
          tags: document.querySelectorAll(`[${TagAttributes.ENTRY_ID}]`).length,
        });

        return Promise.resolve(ContentfulLivePreview.fieldTagging);
      }
    }
  }

  static subscribe(data: Argument, locale: string, callback: SubscribeCallback): VoidFunction {
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
  }: LivePreviewProps): Record<TagAttributes, string | null | undefined> {
    return {
      [TagAttributes.FIELD_ID]: fieldId,
      [TagAttributes.ENTRY_ID]: entryId,
      [TagAttributes.LOCALE]: locale,
    };
  }

  static togglefieldTagging(): boolean {
    return (this.fieldTaggingEnabled = !this.fieldTaggingEnabled);
  }

  static toggleLiveUpdatesMode(): boolean {
    return (this.liveUpdatesEnabled = !this.liveUpdatesEnabled);
  }

  static setupFieldTagging(): void {
    if (this.fieldTaggingEnabled) {
      ContentfulLivePreview.fieldTagging = new FieldTagging();
      window.addEventListener('message', (event) => {
        if (typeof event.data !== 'object' || !event.data) return;
        if (event.data.from !== 'live-preview') return;

        ContentfulLivePreview.fieldTagging?.receiveMessage(event.data);
      });
    }
  }

  static setupLiveUpdates(): void {
    if (this.liveUpdatesEnabled) {
      ContentfulLivePreview.liveUpdates = new LiveUpdates();

      window.addEventListener('message', (event) => {
        if (typeof event.data !== 'object' || !event.data) return;
        if (event.data.from !== 'live-preview') return;

        ContentfulLivePreview.liveUpdates?.receiveMessage(event.data);
      });
    }
  }
}
