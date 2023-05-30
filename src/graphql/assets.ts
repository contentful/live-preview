import type { AssetProps, EntryProps } from 'contentful-management';

import { debug, setProtocolToHttps } from '../helpers';
import { ASSET_TYPENAME, Entity, GraphQLParams, SysProps } from '../types';
import { updateAliasedInformation } from './queryUtils';

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
  locale: string,
  gqlParams?: GraphQLParams
): T {
  try {
    const file = updateFromEntryEditor.fields.file[locale];

    // Content Type definition for GraphQL
    const result = {
      ...dataFromPreviewApp,
      // GraphQL flattens some information
      // and as the live updates are coming from the CMA, we need to transform them
      title: updateFromEntryEditor.fields.title[locale],
      description: updateFromEntryEditor.fields.description?.[locale],
      contentType: file.contentType,
      url: setProtocolToHttps(file.url),
      // Note: video has no `width` and `height`
      width: file.details?.image?.width,
      height: file.details?.image?.height,
    };

    return updateAliasedInformation(result, ASSET_TYPENAME, gqlParams);
  } catch (err) {
    // During file upload it will throw an error and return the original data in the meantime
    debug.warn('Failed update asset', { dataFromPreviewApp, updateFromEntryEditor, locale }, err);
    return dataFromPreviewApp;
  }
}
