import type { ContentTypeProps } from 'contentful-management';

import type {
  InspectorModeAssetAttributes,
  InspectorModeEntryAttributes,
} from './inspectorMode/types.js';

export type ContentType = ContentTypeProps;

type WithOptional<T, Keys extends keyof T> = Omit<T, Keys> & Partial<Pick<T, Keys>>;

export type LivePreviewEntryProps = WithOptional<
  InspectorModeEntryAttributes,
  'locale' | 'environment' | 'space'
>;
export type LivePreviewAssetProps = WithOptional<
  InspectorModeAssetAttributes,
  'locale' | 'environment' | 'space'
>;

export type LivePreviewProps =
  | (LivePreviewEntryProps & { assetId?: never })
  | (LivePreviewAssetProps & { entryId?: never });

// We had Record<string, any> before, but this will not work with stricter typings
// e.g. contentful client SDK - getEntry & getEntries
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Entity = Record<any, any>;

export type Argument = Entity | Entity[];
export type SubscribeCallback = (data: Argument) => void;

export interface Subscription {
  data: Argument;
  locale?: string;
  callback: SubscribeCallback;
}
