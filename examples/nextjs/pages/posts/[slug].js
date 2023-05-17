import {
  useContentfulInspectorMode,
  useContentfulLiveUpdates,
} from "@contentful/live-preview/react";
import { useRouter } from "next/router";
import Head from "next/head";
import ErrorPage from "next/error";
import { getAllPostsWithSlug, getPost } from "../../lib/api";

export default function Post({ post }) {
  const router = useRouter();
  const updatedPost = useContentfulLiveUpdates(post);
  const inspectorProps = useContentfulInspectorMode({ entryId: post.sys.id });

  if (!router.isFallback && !updatedPost) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <>
      <h1 {...inspectorProps({ fieldId: "title" })}>{updatedPost?.title || ''}</h1>
      <p {...inspectorProps({ fieldId: "description" })}>
        {updatedPost?.description || ''}
      </p>
    </>
  );
}

export async function getStaticProps({ params, draftMode = false }) {
  const post = await getPost(params.slug, draftMode);

  return {
    props: {
      post: post.post ?? null,
    },
  };
}

export async function getStaticPaths() {
  const allPosts = await getAllPostsWithSlug();
  return {
    paths: allPosts?.map(({ slug }) => `/posts/${slug}`) ?? [],
    fallback: true,
  };
}
