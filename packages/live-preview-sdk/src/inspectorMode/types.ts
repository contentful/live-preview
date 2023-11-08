import type { SetRequired } from 'type-fest';

export type InspectorModeTags = {
  [InspectorModeDataAttributes.ENTRY_ID]: string;
  [InspectorModeDataAttributes.FIELD_ID]: string;
  [InspectorModeDataAttributes.LOCALE]?: string;
} | null;

export const enum InspectorModeDataAttributes {
  FIELD_ID = 'data-contentful-field-id',
  ENTRY_ID = 'data-contentful-entry-id',
  LOCALE = 'data-contentful-locale',
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

export type InspectorModeAttributes = {
  entryId: string;
  fieldId: string;
  locale: string;
};

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
};

export type InspectorModeChangedMessage = {
  /** @deprecated use method instead */
  action: InspectorModeEventMethods.INSPECTOR_MODE_CHANGED;
  isInspectorActive: boolean;
};
