import React from 'react';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { gql } from 'graphql-request';

import { contentful } from '../../lib/contentful.server';
import { isPreviewMode } from '../utils/preview-mode.server';
import { PreviewBanner } from '../components/preview-banner';

type QueryResponse = {
  postCollection: {
    items: Post[];
  };
};

type Post = {
  title: string;
  description: string;
  slug: string;
};

type LoaderData = {
  posts: Post[];
  preview: boolean;
};

const getPostQuery = gql`
  query Post($preview: Boolean!) {
    postCollection(preview: $preview) {
      items {
        # typename and sys.id are required for live preview
        __typename
        sys {
          id
        }
        slug
        title
        description
      }
    }
  }
`;

export const loader: LoaderFunction = async ({ request }) => {
  const preview = await isPreviewMode(request);

  const API_TOKEN = preview
    ? process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN
    : process.env.CONTENTFUL_ACCESS_TOKEN;

  const data = (await contentful.request(
    getPostQuery,
    { preview },
    {
      authorization: `Bearer ${API_TOKEN}`,
    }
  )) as QueryResponse;

  return json({
    posts: data.postCollection.items,
    preview,
  });
};

export default function Index() {
  const { posts, preview } = useLoaderData<LoaderData>();

  return (
    <>
      {preview && <PreviewBanner />}
      {posts.map((post) => (
        <a key={post.title} href={`/${post.slug}`}>
          {post.title}
        </a>
      ))}
    </>
  );
}
