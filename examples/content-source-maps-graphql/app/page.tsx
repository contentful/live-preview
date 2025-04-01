import { draftMode } from 'next/headers';
import { getAllPostsForHome } from '../lib/api-graphql';
import { PostsRenderer } from '../components/PostsRenderer';

export default async function Home() {
  const { isEnabled } = await draftMode();
  const posts = await getAllPostsForHome(isEnabled);

  return (
    <main>
      <PostsRenderer posts={posts} />
    </main>
  );
}
