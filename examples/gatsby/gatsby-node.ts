import { CreatePagesArgs } from 'gatsby';
import path from 'path';

type GatsbyGraphQLResult<T extends { [key: string]: any }> = {
  data?: T;
  errors?: Array<{
    message: string;
  }>;
};

type ContentfulPostResult = {
  allContentfulPost: {
    edges: Array<{
      node: {
        slug: string;
      };
    }>;
  };
};

export const createPages = async ({ graphql, actions }: CreatePagesArgs) => {
  const { createPage } = actions;

  const result: GatsbyGraphQLResult<ContentfulPostResult> = await graphql(`
    query {
      allContentfulPost {
        edges {
          node {
            slug
          }
        }
      }
    }
  `);

  if (result.errors || !result.data) {
    throw result.errors;
  }

  const posts = result.data.allContentfulPost.edges;

  posts.forEach((post) => {
    createPage({
      path: post.node.slug,
      component: path.resolve(`./src/templates/post.tsx`),
      context: {
        slug: post.node.slug,
      },
    });
  });
};
