import { GetStaticProps, NextPage } from 'next';
import { Post, getAllPostsForHome } from '../lib/api-graphql';
import Head from 'next/head';
import Link from 'next/link';

interface IndexProps {
  posts: Post[];
}

const Index: NextPage<IndexProps> = ({ posts }) => {
  return (
    <>
      <Head>
        <title>Contentful live preview example with Next.js and GraphQL</title>
      </Head>
      {posts.map((post) => (
        <Link href={`/posts/${post.slug}`} key={post.sys.id}>
          {post.title}
        </Link>
      ))}
    </>
  );
};

export const getStaticProps: GetStaticProps<IndexProps> = async ({ draftMode = false }) => {
  const posts = (await getAllPostsForHome(draftMode)) ?? [];
  return {
    props: { posts, draftMode },
  };
};

export default Index;
