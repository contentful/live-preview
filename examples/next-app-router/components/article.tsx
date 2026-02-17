/*
  We have to make this a client component to use the `useContentfulInspectorMode` and `useContentfulLiveUpdates` hooks to enable live preview mode.
  This does not mean it is rendered on the client, but that the HTML, CSS and JavaScript are shipped to the client to hydrate the page.
  This is necessary because we need interactivity to enable live preview mode.
*/
'use client';

import Image from 'next/image';
import {
  useContentfulInspectorMode,
  useContentfulLiveUpdates,
} from '@contentful/live-preview/react';
import { BlogProps, brandQuery } from '@/lib/contentful/api';
import { ContentfulLivePreview } from '@contentful/live-preview';

export const Blog = ({ brand }: { brand: any }) => {
  const updatedBrand = useContentfulLiveUpdates(brand, {
    query: brandQuery(brand.data.brand.sys.id),
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24 bg-white">
      <section className="w-full">
        <div className="container space-y-12 px-4 md:px-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
              {updatedBrand.data.brand.name}
            </h1>
            <div className="flex justify-between flex-col md:flex-row">
              <p className="max-w-[900px] text-zinc-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-zinc-400">
                {updatedBrand.data.brand.image?.image?.src}
              </p>
            </div>
          </div>
          <pre>{JSON.stringify(brand, null, 2)}</pre>
          <hr />
          <pre>{JSON.stringify(updatedBrand, null, 2)}</pre>
          <div className="space-y-8 lg:space-y-10">
            {updatedBrand.data.brand.image?.image?.src && (
              <Image
                alt="Blog Image"
                className="aspect-video w-full overflow-hidden rounded-xl object-cover"
                height="365"
                src={updatedBrand.data.brand.image?.image?.src as string}
                width="650"
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
