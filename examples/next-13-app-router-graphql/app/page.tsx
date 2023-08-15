import { getAllPostsForHome } from '@/lib/api-graphql';
import { Metadata } from 'next';
import { draftMode } from 'next/headers';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contentful live preview example with Next.js and GraphQL',
};

export default async function Home() {
  const { isEnabled } = draftMode();

  console.log({ isEnabled });
  const posts = await getAllPostsForHome(true);

  if (!posts || posts.length === 0) {
    return (
      <>
        <main>
          <p>No posts found.</p>
        </main>
      </>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <Link href={`/posts/${post.slug}`} key={post.sys.id}>
          {post.title}
        </Link>
      ))}
    </>
  );
}
