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
  data?: {
    postCollection?: PostCollection;
  };
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

async function fetchGraphQL(query: string, draftMode = false): Promise<FetchResponse> {
  return fetch(
    `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${
          draftMode
            ? process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN
            : process.env.CONTENTFUL_ACCESS_TOKEN
        }`,
      },
      body: JSON.stringify({ query }),
    }
  ).then((response) => response.json());
}

function extractPost(fetchResponse: FetchResponse): Post | undefined {
  return fetchResponse?.data?.postCollection?.items?.[0];
}

function extractPostEntries(fetchResponse: FetchResponse): Post[] | undefined {
  return fetchResponse?.data?.postCollection?.items;
}

export async function getPreviewPostBySlug(slug: string): Promise<Post | undefined> {
  const entry = await fetchGraphQL(
    `query {
      postCollection(where: { slug: "${slug}" }, preview: true, limit: 1) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`,
    true
  );
  return extractPost(entry);
}

export async function getAllPostsWithSlug(): Promise<Post[] | undefined> {
  const entries = await fetchGraphQL(
    `query {
      postCollection(where: { slug_exists: true }) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`
  );
  return extractPostEntries(entries);
}

export async function getAllPostsForHome(draftMode: boolean): Promise<Post[] | undefined> {
  const entries = await fetchGraphQL(
    `query {
      postCollection(preview: ${draftMode ? 'true' : 'false'}) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`,
    draftMode
  );

  console.log(entries);
  return extractPostEntries(entries);
}

export async function getPost(
  slug: string,
  draftMode: boolean
): Promise<{ post: Post | undefined }> {
  const entry = await fetchGraphQL(
    `query {
      postCollection(where: { slug: "${slug}" }, preview: ${
      draftMode ? 'true' : 'false'
    }, limit: 1) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`,
    draftMode
  );
  return {
    post: extractPost(entry),
  };
}
