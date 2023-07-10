// Import your Client Component
import { getAllPostsForHome } from '@/lib/api-graphql';
import { draftMode } from 'next/headers';
import HomePage from './home-page';
import MyLivePreviewProvider from './providers';

async function getPosts() {
  const { isEnabled } = draftMode();

  const posts = (await getAllPostsForHome(isEnabled)) ?? [];
  return posts;
}

export default async function Page() {
  // Fetch data directly in a Server Component
  const posts = await getPosts();

  // Forward fetched data to your Client Component
  return (
    <MyLivePreviewProvider>
      <HomePage posts={posts} />
    </MyLivePreviewProvider>
  );
}
