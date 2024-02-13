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

async function fetchGraphQL(query: string, preview = false, tags: [string] = ['']) {
  return fetch(
    `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Switch the Bearer token depending on whether the fetch is supposed to retrieve draft or published content
        Authorization: `Bearer ${
          preview
            ? process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN
            : process.env.CONTENTFUL_ACCESS_TOKEN
        }`,
      },
      body: JSON.stringify({ query }),
      // Add a Next.js specific header with tags to revalidate the content:
      // Associate all fetches for blogs with an "blogs" cache tag so content can be revalidated or updated from Contentful on publish
      next: { tags },
    },
  ).then((response) => response.json());
}

function extractBlogEntries(fetchResponse: { data: { blogPostCollection: { items: any } } }) {
  return fetchResponse?.data?.blogPostCollection?.items;
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
