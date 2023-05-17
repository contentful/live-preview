import {
  useContentfulInspectorMode,
  useContentfulLiveUpdates,
} from "@contentful/live-preview/react";
import { useRouter } from "next/router";
import Head from "next/head";
import ErrorPage from "next/error";
import { getAllPostsWithSlug, getPost } from "../../lib/api";

export default function Post({ post, preview }) {
  const router = useRouter();
  const updatedPost = useContentfulLiveUpdates(post);
  const inspectorProps = useContentfulInspectorMode({ entryId: post.sys.id });

  if (!router.isFallback && !updatedPost) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <>
      {updatedPost.title && (
        <h1 {...inspectorProps({ fieldId: "title" })}>{updatedPost.title}</h1>
      )}
      {updatedPost.description && (
        <p {...inspectorProps({ fieldId: "description" })}>
          {updatedPost.description}
        </p>
      )}
    </>
  );
}

export async function getStaticProps({ params, preview = false }) {
  const data = await getPost(params.slug, preview);

  return {
    props: {
      preview,
      post: data?.post ?? null,
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
