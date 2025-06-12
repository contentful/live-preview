import { ContentfulLivePreview } from '@contentful/live-preview';
import { Post } from '../../lib/api-graphql';

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
      {post.banner && (
        <img
          {...ContentfulLivePreview.getProps({
            entryId: post.banner.sys.id,
            fieldId: 'title',
            locale: 'en-US',
          })}
          alt={post.banner.title}
          src={post.banner.url}
        />
      )}
    </>
  );
}
