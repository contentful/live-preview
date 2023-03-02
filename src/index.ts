import './styles.css';
import FieldTagging from './field-tagging';
import { LivePreviewProps, TagAttributes } from './types';

export class ContentfulLivePreview {
  static fieldTagging: FieldTagging | null = null;

  // Static method to initialize the LivePreview SDK
  static init(): Promise<FieldTagging> | undefined {
    // Check if running in a browser environment
    if (typeof window !== 'undefined') {
      if (ContentfulLivePreview.fieldTagging) {
        console.log('You have already initialized the Live Preview SDK.');
        return Promise.resolve(ContentfulLivePreview.fieldTagging);
      } else {
        ContentfulLivePreview.fieldTagging = new FieldTagging();
        return Promise.resolve(ContentfulLivePreview.fieldTagging);
      }
    }
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
