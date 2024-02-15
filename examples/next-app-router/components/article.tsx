/*
  We have to make this a client component to use the `useContentfulInspectorMode` and `useContentfulLiveUpdates` hooks to enable live preview mode.
  This does not mean it is rendered on the client, but that the HTML, CSS and JavaScript are shipped to the client to hydrate the page.
  This is necessary because we need interactivity to enable live preview mode.
*/
'use client';

import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import Image from 'next/image';
import {
  useContentfulInspectorMode,
  useContentfulLiveUpdates,
} from '@contentful/live-preview/react';
import { BlogProps } from '@/lib/contentful/api';
import { ContentfulLivePreview } from '@contentful/live-preview';

export const Blog = ({ blog }: { blog: BlogProps }) => {
  const updatedBlog = useContentfulLiveUpdates(blog);
  const inspectorProps = useContentfulInspectorMode({ entryId: blog.sys.id });

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24 bg-white">
      <section className="w-full">
        <div className="container space-y-12 px-4 md:px-6">
          <div className="space-y-4">
            <h1
              className="text-4xl font-bold tracking-tighter sm:text-5xl"
              {...inspectorProps({ fieldId: 'title' })}
            >
              {updatedBlog.title}
            </h1>
            <div className="flex justify-between flex-col md:flex-row">
              <p
                className="max-w-[900px] text-zinc-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-zinc-400"
                {...inspectorProps({ fieldId: 'summary' })}
              >
                {updatedBlog.summary}
              </p>
              <p
                className="text-zinc-500 md:text-lg/relaxed lg:text-sm/relaxed xl:text-lg/relaxed dark:text-zinc-400 italic"
                {...inspectorProps({ fieldId: 'author' })}
              >
                by: {updatedBlog.author}
              </p>
            </div>
          </div>
          <div className="space-y-8 lg:space-y-10">
            <Image
              alt="Blog Image"
              className="aspect-video w-full overflow-hidden rounded-xl object-cover"
              height="365"
              src={updatedBlog.heroImage?.url as string}
              width="650"
              {...ContentfulLivePreview.getProps({
                assetId: updatedBlog.heroImage?.sys.id || '',
                fieldId: 'file',
              })}
            />
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <div
                  className="max-w-[900px] text-zinc-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-zinc-400"
                  {...inspectorProps({ fieldId: 'details' })}
                >
                  {documentToReactComponents(updatedBlog.details.json)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
