import type { AssetProps, EntryProps } from 'contentful-management';

import { debug, setProtocolToHttps } from '../helpers';
import { Entity, SysProps } from '../types';

/**
 * Updates GraphQL response data based on CMA Asset object
 *
 * @param dataFromPreviewApp the GraphQL response to be updated
 * @param updateFromEntryEditor CMA Asset object containing the update
 * @param locale locale code
 */
export function updateAsset<T extends (Entity & { sys: SysProps }) | EntryProps>(
  dataFromPreviewApp: T,
  updateFromEntryEditor: AssetProps,
  locale: string
): T {
  try {
    const file = updateFromEntryEditor.fields.file[locale];

    // Content Type definition for GraphQL
    return {
      ...dataFromPreviewApp,
      // GraphQL flattens some information
      // and as the live updates are coming from the CMA, we need to transform them
      title: updateFromEntryEditor.fields.title[locale],
      description: updateFromEntryEditor.fields.description?.[locale],
      contentType: file.contentType,
      width: file.details?.image.width,
      height: file.details?.image.height,
      url: setProtocolToHttps(file.url),
    };
  } catch (err) {
    // During file upload it will throw an error and return the original data in the meantime
    debug.warn('Failed update asset', { dataFromPreviewApp, updateFromEntryEditor, locale }, err);
    return dataFromPreviewApp;
  }
}
