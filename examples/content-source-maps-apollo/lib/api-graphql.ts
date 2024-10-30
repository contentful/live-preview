import { ApolloClient, ApolloLink, from, gql, HttpLink, InMemoryCache } from '@apollo/client';
import { encodeGraphQLResponse } from '@contentful/live-preview';

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
    // https://github.com/apollographql/apollo-feature-requests/issues/117
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: from([
        new ApolloLink((operation, forward) => {
          return forward(operation).map((response) => {
            response.data = {
              ...response.data,
              extensions: response.extensions,
            };
            return response;
          });
        }),
        new HttpLink({
          uri: `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${
              draftMode
                ? process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN
                : process.env.CONTENTFUL_ACCESS_TOKEN
            }`,
          },
        }),
      ]),
    });

    const result = await client.query({
      query: gql(query),
      // Important: With cache the extensions are stil stripped away
      fetchPolicy: draftMode ? 'no-cache' : 'cache-first',
    });

    if (result.errors) {
      console.error(result.errors);
      throw new Error(`GraphQL query errors: ${result.errors.map((e) => e.message).join(', ')}`);
    }

    const { extensions, ...data } = result.data;

    return { data, extensions };
  } catch (error) {
    console.error(`Error in fetchGraphQL: ${error}`);
    return { errors: [(error as any).message] };
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
