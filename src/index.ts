import './styles.css';

import { FieldTagging } from './field-tagging';
import { sendMessageToEditor, pollUrlChanges, setDebugMode, debug } from './helpers';
import { LiveUpdates } from './live-updates';
import { Argument, LivePreviewProps, SubscribeCallback, TagAttributes } from './types';

interface ContentfulLivePreviewInitConfig {
  debugMode?: boolean;
}

export class ContentfulLivePreview {
  static fieldTagging: FieldTagging | null = null;
  static liveUpdates: LiveUpdates | null = null;

  // Static method to initialize the LivePreview SDK
  static init({ debugMode }: ContentfulLivePreviewInitConfig = {}):
    | Promise<FieldTagging>
    | undefined {
    // Check if running in a browser environment
    if (typeof window !== 'undefined') {
      if (debugMode) {
        setDebugMode(debugMode);
      }

      if (ContentfulLivePreview.fieldTagging) {
        debug.log('You have already initialized the Live Preview SDK.');
        return Promise.resolve(ContentfulLivePreview.fieldTagging);
      } else {
        ContentfulLivePreview.fieldTagging = new FieldTagging();
        ContentfulLivePreview.liveUpdates = new LiveUpdates();

        window.addEventListener('message', (event) => {
          if (typeof event.data !== 'object' || !event.data) return;
          if (event.data.from !== 'live-preview') return;

          ContentfulLivePreview.fieldTagging?.receiveMessage(event.data);
          ContentfulLivePreview.liveUpdates?.receiveMessage(event.data);
        });

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
}
