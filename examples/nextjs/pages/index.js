import { getAllPostsForHome } from "../lib/api";
import Head from "next/head";
import Link from "next/link";

export default function Index({ posts }) {
  return (
    <>
      <Head>
        <title>Contentful live preview example with Next.js</title>
      </Head>
      {posts.map((post) => (
        <Link href={`/posts/${post.slug}`}>{post.title}</Link>
      ))}
    </>
  );
}

export async function getStaticProps({ draftMode = false }) {
  const posts = (await getAllPostsForHome(draftMode)) ?? [];
  return {
    props: { posts },
  };
}
