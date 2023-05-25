import { GetStaticProps, NextPage } from 'next';
import { Post, getAllPostsForHome } from '../lib/api-rest';
import Head from 'next/head';
import Link from 'next/link';
import { Entry } from 'contentful';

type IndexProps = {
  posts: Entry<Post>[];
};

const Index: NextPage<IndexProps> = ({ posts }) => {
  return (
    <>
      <Head>
        <title>Contentful live preview example with Next.js and GraphQL</title>
      </Head>
      {posts.map((post) => (
        <Link href={`/posts/${post.fields.slug}`} key={post.sys.id}>
          <>{post.fields.title}</>
        </Link>
      ))}
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ draftMode = false }) => {
  const posts = await getAllPostsForHome(draftMode);
  return {
    props: { posts, draftMode },
  };
};

export default Index;
