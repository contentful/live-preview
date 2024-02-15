import { Blog, getAllBlogsWithSlug, getBlog } from '@/lib/contentful/api';

import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import {
  useContentfulInspectorMode,
  useContentfulLiveUpdates,
} from '@contentful/live-preview/react';
import { ContentfulLivePreview } from '@contentful/live-preview';
import { ContentfulImage } from '@/components/ContentfulImage';

export const getStaticPaths: GetStaticPaths = async () => {
  const allBlogs = await getAllBlogsWithSlug();
  return {
    paths: allBlogs?.map((blog) => `/blogs/${blog.fields.slug}`) ?? [],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  draftMode,
}: GetStaticPropsContext) => {
  const blog = await getBlog(params?.slug as string, draftMode);
  return { props: { blog } };
};

export default function BlogPage({ blog }: { blog: Blog }) {
  const updatedBlog = useContentfulLiveUpdates(blog);
  const inspectorProps = useContentfulInspectorMode({ entryId: blog.sys.id });

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-white">
      <section className="w-full">
        <div className="container space-y-12 px-4 md:px-6">
          <div className="space-y-4">
            <h1
              className="text-4xl font-bold tracking-tighter sm:text-5xl"
              {...inspectorProps({ fieldId: 'title' })}
            >
              {updatedBlog.fields.title}
            </h1>
            <div className="flex justify-between flex-col md:flex-row">
              <p
                className="max-w-[900px] text-zinc-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-zinc-400"
                {...inspectorProps({ fieldId: 'summary' })}
              >
                {updatedBlog.fields.summary}
              </p>
              <p
                className="text-zinc-500 md:text-lg/relaxed lg:text-sm/relaxed xl:text-lg/relaxed dark:text-zinc-400 italic"
                {...inspectorProps({ fieldId: 'author' })}
              >
                by: {updatedBlog.fields.author}
              </p>
            </div>
          </div>
          <div className="space-y-8 lg:space-y-10">
            <ContentfulImage
              alt="Blog Image"
              className="aspect-video w-full overflow-hidden rounded-xl object-cover"
              height="365"
              src={updatedBlog.fields.heroImage.fields.file?.url as string}
              width="650"
              {...ContentfulLivePreview.getProps({
                assetId: updatedBlog.fields.heroImage.sys.id,
                fieldId: 'file',
              })}
            />
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <div
                  className="max-w-[900px] text-zinc-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-zinc-400"
                  {...inspectorProps({ fieldId: 'details' })}
                >
                  {documentToReactComponents(updatedBlog.fields.details)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
