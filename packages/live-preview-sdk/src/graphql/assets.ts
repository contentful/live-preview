import type { Asset, AssetDetails } from 'contentful';

import { debug, setProtocolToHttps } from '../helpers';
import { ASSET_TYPENAME, Entity, GraphQLParams, SysProps } from '../types';
import { updateAliasedInformation } from './queryUtils';

/**
 * Updates GraphQL response data based on Asset object
 */
export function updateAsset<T extends Entity & { sys: SysProps }>(
  dataFromPreviewApp: T,
  updateFromEntryEditor: Asset,
  gqlParams?: GraphQLParams
): T {
  try {
    const file = updateFromEntryEditor.fields.file;
    const details = file?.details as AssetDetails | undefined;

    // Content Type definition for GraphQL
    const result = {
      ...dataFromPreviewApp,
      // GraphQL flattens some information
      // and as the live updates are coming from the CMA, we need to transform them
      title: updateFromEntryEditor.fields.title,
      description: updateFromEntryEditor.fields.description,
      contentType: file?.contentType,
      url: setProtocolToHttps(file?.url as string | undefined),
      // Note: video has no `width` and `height`
      width: details?.image?.width,
      height: details?.image?.height,
    };

    return updateAliasedInformation(result, ASSET_TYPENAME, gqlParams);
  } catch (err) {
    // During file upload it will throw an error and return the original data in the meantime
    debug.warn('Failed update asset', { dataFromPreviewApp, updateFromEntryEditor }, err);
    return dataFromPreviewApp;
  }
}
