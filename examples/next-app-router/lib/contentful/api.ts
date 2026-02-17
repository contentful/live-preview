import { encodeGraphQLResponse } from '@contentful/live-preview';
import { gql } from 'graphql-request';

export interface BlogProps {
  sys: {
    id: string;
  };
  slug: string;
  title: string;
  summary: string;
  author: string;
  heroImage?: {
    sys: {
      id: string;
    };
    url: string;
  };
  categoryName: string;
  date: Date;
  details: {
    json: any;
  };
}

// Set a variable that contains all the fields needed for blogs when a fetch for content is performed
const BLOG_GRAPHQL_FIELDS = `
  sys {
    id
  }
  __typename
  title
  slug
  summary
  details {
    json
  }
  date
  author
  categoryName
  heroImage {
    sys {
      id
    }
    __typename
    url
  }
`;

async function fetchGraphQL(query: string, preview = true, tags: [string] = ['']) {
  return fetch(
    `https://graphql.contentful.com/content/v1/spaces/${process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Switch the Bearer token depending on whether the fetch is supposed to retrieve draft or published content
        Authorization: `Bearer ${
          preview
            ? process.env.NEXT_PUBLIC_CONTENTFUL_PREVIEW_ACCESS_TOKEN
            : process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN
        }`,
      },
      body: JSON.stringify({ query, variables: {} }),
      // Add a Next.js specific header with tags to revalidate the content:
      // Associate all fetches for blogs with an "blogs" cache tag so content can be revalidated or updated from Contentful on publish
      next: { tags },
    },
  ).then((response) => response.json());
}

function extractBlogEntries(fetchResponse: { data: { blogPostCollection: { items: any } } }) {
  return fetchResponse?.data?.blogPostCollection?.items;
}

const imageFragment = `
fragment imageFragment on ImageWrapper {
  __typename
  image {
    src: url
  }
}
`;

export const brandQuery = (id: string) => gql`
${imageFragment}
query @contentSourceMaps {
  brand(id: "${id}", preview: true) {
    __typename
    sys {
      id
    }
    name
    image {
      __typename
      ...imageFragment
    }
    asset {
      contentType
      description
      fileName
      height
      size
      title
      url
      width
    }
  }
}`;

export const brandsQuery = (id: string) => gql`
${imageFragment}
query @contentSourceMaps {
  brandCollection(where: { sys: { id: "${id}" } }, preview: true) {
    items {
      __typename
      sys {
        id
      }
      name
      image {
        __typename
        ...imageFragment
      }
      asset {
        contentType
        description
        fileName
        height
        size
        title
        url
        width
      }
    }
  }
}`;

export async function getBrand(id: string) {
  const q = brandQuery(id);
  const brandResult = await fetchGraphQL(q, true);

  console.log(JSON.stringify({ brandResult }, null, 2));

  const response = encodeGraphQLResponse(brandResult);
  return response;
}

export async function getAllBlogs(limit = 3, isDraftMode = false) {
  const blogs = await fetchGraphQL(
    `query {
      blogPostCollection(where:{slug_exists: true}, order: date_DESC, limit: ${limit}, preview: ${
        isDraftMode ? 'true' : 'false'
      }) {
          items {
            ${BLOG_GRAPHQL_FIELDS}
          }
        }
      }`,
    isDraftMode,
    ['blogs'],
  );

  return extractBlogEntries(blogs);
}

export async function getBlog(slug: string, isDraftMode = false) {
  const blog = await fetchGraphQL(
    `query {
      blogPostCollection(where:{slug: "${slug}"}, limit: 1, preview: ${
        isDraftMode ? 'true' : 'false'
      }) {
          items {
            ${BLOG_GRAPHQL_FIELDS}
          }
        }
      }`,
    isDraftMode,
    [slug],
  );
  return extractBlogEntries(blog)[0];
}
