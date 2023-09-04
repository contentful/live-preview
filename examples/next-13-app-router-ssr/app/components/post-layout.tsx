import { Post } from '../../lib/api-graphql';
import { ContentfulLivePreview } from '@contentful/live-preview';

export default function PostLayout({ post }: { post: Post }) {
  return (
    <>
      <h1
        {...ContentfulLivePreview.getProps({
          entryId: post.sys.id,
          fieldId: 'title',
          locale: 'en-US',
        })}
      >
        {post.title}
      </h1>
      <p
        {...ContentfulLivePreview.getProps({
          entryId: post.sys.id,
          fieldId: 'description',
          locale: 'en-US',
        })}
      >
        {post.description}
      </p>
    </>
  );
}
