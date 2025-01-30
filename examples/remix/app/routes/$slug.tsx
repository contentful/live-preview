import React from 'react';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { gql } from 'graphql-request';
import {
  useContentfulInspectorMode,
  useContentfulLiveUpdates,
} from '@contentful/live-preview/react';

import { PreviewBanner } from '../components/preview-banner';
import { getEntryBySlug } from '../../lib/contentful.server';
import { isPreviewMode } from '../utils/preview-mode.server';
import type { LoaderData } from '../../types';

const getPostQuery = gql`
  query Post($slug: String!, $preview: Boolean!) {
    postCollection(where: { slug: $slug }, limit: 1, preview: $preview) {
      items {
        # typename and sys.id are required for live preview
        __typename
        sys {
          id
        }
        title
        description
      }
    }
  }
`;

export const loader: LoaderFunction = async ({ params, request }) => {
  const { slug } = params;
  const preview = await isPreviewMode(request);
  const data = slug && await getEntryBySlug({
    spaceId: process.env.CONTENTFUL_SPACE_ID || '',
    accessToken: preview ? process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN || '' : process.env.CONTENTFUL_ACCESS_TOKEN || '',
    query: getPostQuery,
    slug,
    preview
  });
  const post = data && data.postCollection.items[0];

  return json({
    post,
    preview,
  });
};

export default function PostDetailPage() {
  const { post, preview } = useLoaderData<LoaderData>();
  const inspectorProps = useContentfulInspectorMode({ entryId: post?.sys.id });
  const updatedPost = useContentfulLiveUpdates(post);

  return (
    <>
      {preview && <PreviewBanner />}
      
      {post && (
        <>
          <h1 {...inspectorProps({ fieldId: 'title' })}>{updatedPost.title || ''}</h1>
          <div {...inspectorProps({ fieldId: 'description' })}>{updatedPost.description || ''}</div>
        </>
      )}
    </>
  );
}
