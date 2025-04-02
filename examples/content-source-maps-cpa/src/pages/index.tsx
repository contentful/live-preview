import { GetStaticProps } from 'next';
import { Post as PostType, getAllPostsForHome } from '../../lib/api-rest';
import { useContentfulLiveUpdates } from '@contentful/live-preview/react';

const Post = ({ post }: { post: PostType }) => {
  return (
    <li>
      <h1>{post.fields.title}</h1>
    </li>
  );
};

const Index = ({ posts }: { posts: PostType[] }) => {
  const updatedPosts = useContentfulLiveUpdates(posts);

  return (
    <ul>{updatedPosts && updatedPosts.map((post) => <Post key={post.sys.id} post={post} />)}</ul>
  );
};

export const getStaticProps: GetStaticProps = async ({ draftMode = false }) => {
  const posts = await getAllPostsForHome(draftMode);
  return {
    props: { posts, draftMode },
  };
};

export default Index;
