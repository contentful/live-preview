import {
  ContentTypeProps,
  EntryProps,
  AssetProps,
  ContentFields,
} from 'contentful-management/types';

import { SysProps } from '../types';
import { updateEntry } from './entries';

const field = (name: string, type = 'Symbol'): ContentFields => ({
  id: name,
  name,
  type,
  localized: true,
  required: false,
});

/**
 * Hand-coded Asset Content Type to have consistent handling for Entries
 * and Assets.
 */
const AssetContentType = {
  name: 'Asset',
  fields: [
    field('title'),
    field('description'),

    // File attributes
    field('fileName'),
    field('contentType'),
    field('url'),
    field('size', 'Integer'),
    field('width', 'Integer'),
    field('height', 'Integer'),
  ],
} as ContentTypeProps;

/**
 * Updates GraphQL response data based on CMA Asset object
 *
 *
 * @param data the GraphQL response to be updated
 * @param asset CMA Asset object containing the update
 * @param locale locale code
 */
export function updateAsset(
  data: Record<string, unknown> & { sys: SysProps },
  update: AssetProps,
  locale: string
): Record<string, unknown> {
  // FIXME: copy nested asset.fields.file values to root to match the
  // Content Type definition for GraphQL
  return updateEntry(AssetContentType, data, update as unknown as EntryProps, locale);
}
