import { GetStaticProps, GetStaticPaths, NextPage } from 'next';
import { Entry } from 'contentful';
import {
  useContentfulInspectorMode,
  useContentfulLiveUpdates,
} from '@contentful/live-preview/react';
import { useRouter } from 'next/router';
import ErrorPage from 'next/error';
import { Post as PostType, getAllPostsWithSlug, getPost } from '../../lib/api-rest';

interface PostProps {
  post: Entry<PostType, undefined, string> | null;
  draftMode: boolean;
}

const Post: NextPage<PostProps> = ({ post }) => {
  const router = useRouter();
  const updatedPost = useContentfulLiveUpdates(post);
  const inspectorProps = useContentfulInspectorMode({ entryId: post?.sys.id });

  if (!router.isFallback && !updatedPost) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <>
      <h1 {...inspectorProps({ fieldId: 'title' })}>{updatedPost?.fields.title || ''}</h1>
      <p {...inspectorProps({ fieldId: 'description' })}>{updatedPost?.fields.description || ''}</p>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ params, draftMode = false }) => {
  const slug = params ? (Array.isArray(params.slug) ? params.slug[0] : params.slug) : undefined;

  if (!slug) {
    return { notFound: true };
  }

  const post = await getPost(slug, draftMode);

  return {
    props: {
      post: post ?? null,
      draftMode,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const allPosts = await getAllPostsWithSlug();
  return {
    paths: allPosts?.map((post) => `/posts/${post.fields.slug}`) ?? [],
    fallback: true,
  };
};

export default Post;
