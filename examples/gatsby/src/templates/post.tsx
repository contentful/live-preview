import React from 'react';
import { graphql, PageProps } from 'gatsby';
import {
  useContentfulInspectorMode,
  useContentfulLiveUpdates,
} from '@contentful/live-preview/react';

type DataProps = {
  contentfulPost: {
    contentful_id: string;
    title: string;
  };
};

const PostTemplate: React.FC<PageProps<DataProps>> = ({ data: { contentfulPost } }) => {
  const inspectorProps = useContentfulInspectorMode();
  const updatedPost = useContentfulLiveUpdates({
    ...contentfulPost,
    sys: { id: contentfulPost.contentful_id },
  });

  return (
    <div>
      <h1
        {...inspectorProps({
          entryId: contentfulPost.contentful_id,
          fieldId: 'title',
        })}
      >
        {updatedPost.title || ''}
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
