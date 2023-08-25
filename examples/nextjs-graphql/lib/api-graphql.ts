import type { DocumentNode } from 'graphql';
import { GraphQLClient } from 'graphql-request';
import gql from 'graphql-tag';

interface Sys {
  id: string;
}

export interface Post {
  __typename: string;
  sys: Sys;
  slug: string;
  title: string;
  description: string;
}

interface PostCollection {
  items: Post[];
}

interface FetchResponse {
  postCollection?: PostCollection;
}

const POST_GRAPHQL_FIELDS = `
__typename
sys {
  id
}
slug
title
description
`;

export const POST_QUERY = gql`
  query postCollection($slug: String!, $preview: Boolean!) {
    postCollection(where: { slug: $slug }, preview: $preview, limit: 1) {
      items {
        ${POST_GRAPHQL_FIELDS}
      }
    }
  }
`;

export const ALL_POSTS_SLUGGED_QUERY = gql`
  query postCollectionSlugged($preview: Boolean!) {
    postCollection(where: { slug_exists: true }, preview: $preview) {
      items {
        ${POST_GRAPHQL_FIELDS}
      }
    }
  }
`;

export const ALL_POSTS_HOMEPAGE_QUERY = gql`
  query postCollectionHomepage($preview: Boolean!) {
    postCollection(preview: $preview) {
      items {
        ${POST_GRAPHQL_FIELDS}
      }
    }
}
`;

const client = new GraphQLClient(
  `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`
);

async function fetchGraphQL(
  query: DocumentNode,
  variables: Record<string, string | number | boolean>,
  draftMode = false
) {
  return client.request<{ postCollection?: PostCollection }>(
    query,
    {
      ...variables,
      preview: draftMode,
    },
    {
      Authorization: `Bearer ${
        draftMode
          ? process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN
          : process.env.CONTENTFUL_ACCESS_TOKEN
      }`,
    }
  );
}

function extractPost(fetchResponse: FetchResponse): Post | undefined {
  return fetchResponse?.postCollection?.items?.[0];
}

function extractPostEntries(fetchResponse: FetchResponse): Post[] | undefined {
  return fetchResponse?.postCollection?.items;
}

export async function getPreviewPostBySlug(slug: string): Promise<Post | undefined> {
  const entry = await fetchGraphQL(POST_QUERY, { slug }, true);

  return extractPost(entry);
}

export async function getAllPostsWithSlug(): Promise<Post[] | undefined> {
  const entries = await fetchGraphQL(ALL_POSTS_SLUGGED_QUERY, {}, false);

  return extractPostEntries(entries);
}

export async function getAllPostsForHome(draftMode: boolean): Promise<Post[] | undefined> {
  const entries = await fetchGraphQL(ALL_POSTS_HOMEPAGE_QUERY, {}, draftMode);

  return extractPostEntries(entries);
}

export async function getPost(
  slug: string,
  draftMode: boolean
): Promise<{ post: Post | undefined }> {
  const entry = await fetchGraphQL(POST_QUERY, { slug }, draftMode);

  return { post: extractPost(entry) };
}
