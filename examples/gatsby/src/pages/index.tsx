import * as React from 'react';
import { Link, graphql } from 'gatsby';
import type { PageProps } from 'gatsby';

type DataProps = {
  allContentfulPost: {
    nodes: {
      slug: string;
      title: string;
    }[];
  };
};

const IndexPage: React.FC<PageProps<DataProps>> = ({ data }) => {
  console.log(data.allContentfulPost.nodes);
  return (
    <main>
      {data.allContentfulPost.nodes.map((post) => (
        <Link to={`/${post.slug}`}>{post.title}</Link>
      ))}
    </main>
  );
};

export default IndexPage;

export const query = graphql`
  query {
    allContentfulPost {
      nodes {
        __typename
        contentful_id
        slug
        title
      }
    }
  }
`;
