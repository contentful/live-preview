import { GraphQLClient } from 'graphql-request';
import type { QueryResponse, Variables } from '../types'

const fetchData = async (spaceId: string, accessToken: string, query: string, variables: Variables, preview: boolean) => {
  const client = new GraphQLClient(`https://graphql.contentful.com/content/v1/spaces/${spaceId}`);
  const data = (await client.request(
    query,
    variables,
    { authorization: `Bearer ${accessToken}` }
  )) as QueryResponse;

  return data;
}

// The `spaceId` and `accessToken` are passed as arguments from a `loader` function
// to these utility functions. This approach avoids browser errors that occur when
// trying to access `process.env` from this file, even though it is not executed in
// the browser. This is likely a Remix bundling issue.
export const getEntryBySlug = async ({
  spaceId,
  accessToken,
  query,
  slug,
  preview,
}: {
  spaceId: string,
  accessToken: string,
  query: string,
  slug: string,
  preview: boolean,
}) => fetchData(spaceId, accessToken, query, { slug, preview }, preview);

export const getEntries = async ({
  spaceId,
  accessToken,
  query,
  preview,
}: {
  spaceId: string,
  accessToken: string,
  query: string,
  preview: boolean,
}) => fetchData(spaceId, accessToken, query, { preview }, preview);
