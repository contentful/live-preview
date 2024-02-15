import { Blog, getAllBlogsForHome } from '@/lib/contentful/api';
import Link from 'next/link';
import { GetStaticPropsContext } from 'next';
import { ContentfulImage } from '@/components/ContentfulImage';

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const isEnabled = context.draftMode;
  const blogs = await getAllBlogsForHome(isEnabled);
  return { props: { blogs } };
};

export default function Home(props: { blogs: Array<Blog> }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-white">
      <section className="w-full pt-12">
        <div className="mx-auto container space-y-12 px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Welcome to our Knowledge Base
              </h1>
              <p className="max-w-[900px] text-zinc-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-zinc-400">
                Discover our latest blogs and stay up to date with the newest technologies,
                features, and trends.
              </p>
            </div>
          </div>
          <div className="space-y-12">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {props.blogs.map((blog: Blog) => (
                <article
                  key={blog.sys.id}
                  className="h-full flex flex-col rounded-lg shadow-lg overflow-hidden"
                >
                  <ContentfulImage
                    alt="placeholder"
                    className="aspect-[4/3] object-cover w-full"
                    height="263"
                    src={blog.fields.heroImage.fields.file?.url as string}
                    width="350"
                  />
                  <div className="flex-1 p-6">
                    <Link href={`/blogs/${blog.fields.slug}`}>
                      <h3 className="text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50  py-4">
                        {blog.fields.title}
                      </h3>
                    </Link>
                    <div className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-800">
                      {blog.fields.categoryName}
                    </div>
                    <p className="max-w-none text-zinc-500 mt-4 mb-2 text-sm dark:text-zinc-400">
                      {blog.fields.summary}
                    </p>
                    <p className="max-w-none text-zinc-600 mt-2 mb-2 text-sm font-bold dark:text-zinc-400">
                      Written by: {blog.fields.author}
                    </p>
                    <div className="flex justify-end">
                      <Link
                        className="inline-flex h-10 items-center justify-center text-sm font-medium"
                        href={`/blogs/${blog.fields.slug}`}
                      >
                        Read More →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
