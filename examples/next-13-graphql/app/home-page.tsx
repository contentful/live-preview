'use client';
import Link from 'next/link';
import type { Post } from '../lib/api-graphql';

interface Props {
  posts: Post[];
}
// This is a Client Component. It receives data as props and
// has access to state and effects just like Page components
// in the `pages` directory.
export default function HomePage({ posts }: Props) {
  return (
    <div>
      {posts.map((post) => (
        <Link href={`/posts/${post.slug}`} key={post.sys.id}>
          {post.title}
        </Link>
      ))}
    </div>
  );
}
