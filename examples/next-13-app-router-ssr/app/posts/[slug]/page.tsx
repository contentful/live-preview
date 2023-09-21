import { draftMode } from 'next/headers';
import { getAllPostsWithSlug, getPost } from '../../../lib/api-graphql';

import PostLayout from '../../components/post-layout';

export default async function Post({ params }: { params: { slug: string } }) {
  const { isEnabled } = draftMode();

  const { post } = await getPost(params.slug, isEnabled);

  if (!post) {
    return <h1>Post "{params.slug}" not found</h1>;
  }

  return <PostLayout post={post} />;
}

export async function generateStaticParams() {
  const posts = await getAllPostsWithSlug();

  return posts?.map((post) => ({
    slug: post.slug,
  }));
}
