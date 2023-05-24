import { GraphQLClient } from "graphql-request";

const SPACE = process.env.CONTENTFUL_SPACE_ID;

const endpoint = `https://graphql.contentful.com/content/v1/spaces/${SPACE}`;

export const contentful = new GraphQLClient(endpoint);
