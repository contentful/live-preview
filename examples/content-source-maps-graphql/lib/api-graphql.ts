import { encodeGraphQLResponse } from '@contentful/live-preview';
import { rawRequest } from 'graphql-request';
import gql from 'graphql-tag';
import { print } from 'graphql';

interface Sys {
  id: string;
}

export interface Post {
  __typename: string;
  sys: Sys;
  name: string;
  image?: {
    __typename: string;
    sys: Sys;
    src: string;
  };
  logo?: {
    __typename: string;
    sys: Sys;
    url: string;
  };
  imagesCollection?: {
    items: Array<{
      __typename: string;
      sys: Sys;
      source: string;
    }>;
  };
  ref?: {
    __typename: string;
    sys: Sys;
    topicName: string;
    featureImage?: {
      __typename: string;
      sys: Sys;
      src: string;
    };
    featureImageWrapper?: {
      __typename: string;
      sys: Sys;
      title?: string;
      aliasedImage?: {
        __typename: string;
        sys: Sys;
        src: string;
      };
    };
  };
}

// const POST_GRAPHQL_FIELDS = `
// __typename
// sys {
//   id
// }
// title
// `;

interface PostCollection {
  items: Post[];
}

interface FetchResponse {
  data?: {
    postCollection?: PostCollection;
  };
}

export const IMAGE_FRAGMENT = gql`
  fragment ImageFields on Asset {
    __typename
    sys {
      id
    }
    src: url
  }
`;

export const IMAGE_WRAPPER_FRAGMENT = gql`
  fragment ImageWrapperFields on ImageWrapper {
    __typename
    sys {
      id
    }
    title: textField
    aliasedImage: placeholderImage {
      ...ImageFields
    }
  }
  ${IMAGE_FRAGMENT}
`;

export const PRODUCT_TOPIC_FRAGMENT = gql`
  fragment ProductTopicFields on ProductTopic {
    topicName: name
    featureImage {
      ...ImageFields
    }
    featureImageWrapper {
      ...ImageWrapperFields
    }
  }
  ${IMAGE_WRAPPER_FRAGMENT}
`;

// placeholderImage {
//   ...Image
//   fallbackImage: image(locale: "en") {
//     src: url
//     intrinsicWidth: width
//     intrinsicHeight: height
//   }
// }

export const GET_ALL_POSTS_QUERY = gql`
  query GetAllPosts @contentSourceMaps {
    postCollection(preview: true, limit: 2) {
      items {
        __typename
        sys {
          id
        }
        name: title
        ref {
          __typename
          sys {
            id
          }
          ...ProductTopicFields
        }
      }
    }
  }
  ${PRODUCT_TOPIC_FRAGMENT}
`;

export const GET_CASE_STUDY_QUERY = gql`
  query getCaseStudyById(
    $locale: String!
    $id: String!
    $target: String!
    $alternativeLocale: String!
    $preview: Boolean! = false
  ) {
    caseStudyCollection(
      locale: $locale
      where: { sys: { id: $id }, targetWebsite_contains_some: [$target] }
      limit: 1
      preview: $preview
    ) {
      items {
        __typename
        sys {
          id
        }
      }
    }
  }
`;

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
    // @ts-expect-error - temp
    return { errors: [error.message] };
  }
}

function extractPostEntries(fetchResponse: FetchResponse): Post[] | undefined {
  return fetchResponse?.data?.postCollection?.items;
}

export const getAllPostsQueryString = (): string => print(GET_ALL_POSTS_QUERY);

export async function getAllPostsForHome(draftMode: boolean): Promise<Post[] | undefined> {
  const entries = await fetchGraphQL(getAllPostsQueryString(), draftMode);

  // Conditionally encode the entries only in draft mode
  const finalEntries = draftMode ? encodeGraphQLResponse(entries) : entries;

  return extractPostEntries(finalEntries);
}
