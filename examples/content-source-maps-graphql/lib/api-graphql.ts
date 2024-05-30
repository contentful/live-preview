import { encodeGraphQLResponse } from '@contentful/live-preview';
import { rawRequest } from 'graphql-request';

interface Sys {
  id: string;
}

export interface Post {
  __typename: string;
  sys: Sys;
  title: string;
}

const POST_GRAPHQL_FIELDS = `
__typename
sys {
  id
}
title
`;

interface PostCollection {
  items: Post[];
}

interface FetchResponse {
  data?: {
    postCollection?: PostCollection;
  };
}

async function fetchGraphQL(query: string, draftMode = false): Promise<any> {
  try {
    const url = `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${
        draftMode
          ? process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN
          : process.env.CONTENTFUL_ACCESS_TOKEN
      }`,
    };

    // Return extensions; locate Content Source Maps within the GraphQL extensions
    const { data, errors, extensions } = await rawRequest(url, query, {}, headers);

    if (errors) {
      console.error(errors);
      throw new Error(`GraphQL query errors: ${errors.map((e) => e.message).join(', ')}`);
    }

    return { data, extensions };
  } catch (error) {
    console.error(`Error in fetchGraphQL: ${error}`);
    return { errors: [error.message] };
  }
}

function extractPostEntries(fetchResponse: FetchResponse): Post[] | undefined {
  return fetchResponse?.data?.postCollection?.items;
}

export async function getAllPostsForHome(draftMode: boolean): Promise<Post[] | undefined> {
  const entries = await fetchGraphQL(
    `query @contentSourceMaps {
      postCollection(preview: ${draftMode ? 'true' : 'false'}, limit: 2) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`,
    draftMode,
  );

  // Conditionally encode the entries only in draft mode
  const finalEntries = draftMode ? encodeGraphQLResponse(entries) : entries;

  return extractPostEntries(finalEntries);
}
