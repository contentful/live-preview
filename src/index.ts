import './styles.css';
import { ContentfulFieldTagging } from './field-tagging';
import { ContentfulLiveUpdates, type Entity, type SubscribeCallback } from './live-updates';
import { LivePreviewProps, TagAttributes } from './types';

export class ContentfulLivePreview {
  static fieldTagging: ContentfulFieldTagging | null = null;
  static liveUpdates: ContentfulLiveUpdates | null = null;

  // Static method to initialize the LivePreview SDK
  static init(): Promise<ContentfulFieldTagging> | undefined {
    // Check if running in a browser environment
    if (typeof window !== 'undefined') {
      if (ContentfulLivePreview.fieldTagging) {
        console.log('You have already initialized the Live Preview SDK.');
        return Promise.resolve(ContentfulLivePreview.fieldTagging);
      } else {
        ContentfulLivePreview.fieldTagging = new ContentfulFieldTagging();
        ContentfulLivePreview.liveUpdates = new ContentfulLiveUpdates();

        window.addEventListener('message', (event) => {
          if (typeof event.data !== 'object' || !event.data) return;
          if (event.data.from !== 'live-preview') return;

          ContentfulLivePreview.fieldTagging?.receiveMessage(event.data);
          ContentfulLivePreview.liveUpdates?.receiveMessage(event.data);
        });

        return Promise.resolve(ContentfulLivePreview.fieldTagging);
      }
    }
  }

  static subscribe(data: Entity, locale: string, callback: SubscribeCallback): VoidFunction {
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
