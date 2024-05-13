import type { SetRequired } from 'type-fest';

type InspectorModeSharedTags = {
  [InspectorModeDataAttributes.FIELD_ID]: string;
  [InspectorModeDataAttributes.LOCALE]?: string;
  [InspectorModeDataAttributes.ENVIRONMENT]?: string;
  [InspectorModeDataAttributes.SPACE]?: string;
};

export type InspectorModeEntryTags = InspectorModeSharedTags & {
  [InspectorModeDataAttributes.ENTRY_ID]: string;
};
export type InspectorModeAssetTags = InspectorModeSharedTags & {
  [InspectorModeDataAttributes.ASSET_ID]: string;
};
export type InspectorModeTags = InspectorModeEntryTags | InspectorModeAssetTags | null;

export const enum InspectorModeDataAttributes {
  FIELD_ID = 'data-contentful-field-id',
  ENTRY_ID = 'data-contentful-entry-id',
  ASSET_ID = 'data-contentful-asset-id',
  LOCALE = 'data-contentful-locale',
  SPACE = 'data-contentful-space',
  ENVIRONMENT = 'data-contentful-environment',
  AUTO_TAGGED = 'data-contentful-auto-tagged',
}

export enum InspectorModeEventMethods {
  MOUSE_MOVE = 'MOUSE_MOVE',
  SCROLL_START = 'SCROLL_START',
  SCROLL_END = 'SCROLL_END',
  RESIZE_START = 'RESIZE_START',
  RESIZE_END = 'RESIZE_END',
  TAGGED_ELEMENTS = 'TAGGED_ELEMENTS',
  INSPECTOR_MODE_CHANGED = 'INSPECTOR_MODE_CHANGED',
}

type InspectorModeSharedAttributes = {
  fieldId: string;
  locale: string;
  space?: string;
  environment?: string;
  autoTagged?: boolean;
};
export type InspectorModeEntryAttributes = InspectorModeSharedAttributes & {
  entryId: string;
};
export type InspectorModeAssetAttributes = InspectorModeSharedAttributes & {
  assetId: string;
};

export type InspectorModeAttributes = InspectorModeEntryAttributes | InspectorModeAssetAttributes;

export type InspectorModeElement = {
  attributes?: InspectorModeAttributes | null;
  coordinates: DOMRect;
};

export type InspectorModeScrollMessage = Record<string, never>;
export type InspectorModeResizeMessage = Record<string, never>;
export type InspectorModeMouseMoveMessage = {
  element: SetRequired<InspectorModeElement, 'attributes'> | null;
};
export type InspectorModeTaggedElementsMessage = {
  elements: Array<InspectorModeElement>;
  manualTagCount: number;
  autoTagCount: number;
};

export type InspectorModeChangedMessage = {
  /** @deprecated use method instead */
  action: InspectorModeEventMethods.INSPECTOR_MODE_CHANGED;
  isInspectorActive: boolean;
};
