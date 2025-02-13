import { draftMode } from 'next/headers';
import { getAllPostsWithSlug, getPost } from '../../../lib/api-graphql';

import PostLayout from '../../components/post-layout';

export default async function Post(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { isEnabled } = await draftMode();

  const { post } = await getPost(params.slug, isEnabled);

  if (!post) {
    const formattedPost = `Post ${params.slug} not found`;
    return <h1>{formattedPost}</h1>;
  }

  return <PostLayout post={post} />;
}

export async function generateStaticParams() {
  const posts = await getAllPostsWithSlug();

  return posts?.map((post) => ({
    slug: post.slug,
  }));
}
