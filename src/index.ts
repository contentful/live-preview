import './styles.css';
import FieldTagging from './field-tagging';
import { Entity, LiveUpdates, SubscribeCallback } from './live-updates';
import { LivePreviewProps, TagAttributes } from './types';

export class ContentfulLivePreview {
  static fieldTagging: FieldTagging | null = null;
  static liveUpdates: LiveUpdates | null = null;

  // Static method to initialize the LivePreview SDK
  static init(): Promise<FieldTagging> | undefined {
    // Check if running in a browser environment
    if (typeof window !== 'undefined') {
      if (ContentfulLivePreview.fieldTagging) {
        console.log('You have already initialized the Live Preview SDK.');
        return Promise.resolve(ContentfulLivePreview.fieldTagging);
      } else {
        ContentfulLivePreview.fieldTagging = new FieldTagging();
        ContentfulLivePreview.liveUpdates = new LiveUpdates();

        window.addEventListener('message', (event) => {
          if (typeof event.data !== 'object') return;
          if (event.data.from !== 'live-preview') return;

          ContentfulLivePreview.fieldTagging?.bindIncommingMessage(event.data)
          ContentfulLivePreview.liveUpdates?.bindIncommingMessage(event.data)
        })

        return Promise.resolve(ContentfulLivePreview.fieldTagging);
      }
    }
  }

  static subscribe(data: Entity, locale: string, callback: SubscribeCallback): VoidFunction {
    if (!this.liveUpdates) {
      throw new Error('Live Updates are not initialized, please call `ContentfulLivePreview.init()` first.')
    }

    return this.liveUpdates.subscribe(data, locale, callback)
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
