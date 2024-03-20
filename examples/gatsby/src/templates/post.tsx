import React from 'react';
import { graphql, PageProps } from 'gatsby';
import { useContentfulInspectorMode } from '@contentful/live-preview/react';

type DataProps = {
  contentfulPost: {
    contentful_id: string;
    title: string;
  };
};

const PostTemplate: React.FC<PageProps<DataProps>> = ({ data: { contentfulPost } }) => {
  const inspectorProps = useContentfulInspectorMode();

  return (
    <div>
      <h1
        {...inspectorProps({
          entryId: contentfulPost.contentful_id,
          fieldId: 'title',
        })}
      >
        {contentfulPost.title || ''}
      </h1>
    </div>
  );
};

export default PostTemplate;

export const query = graphql`
  query ($slug: String!) {
    contentfulPost(slug: { eq: $slug }) {
      __typename
      contentful_id
      title
    }
  }
`;
