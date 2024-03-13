import { BlogProps, getAllBlogs, getBlog } from '@/lib/contentful/api';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';
import { Blog } from '@/components/article';
import { ContentfulPreviewProvider } from '@/components/contentful-preview-provider';

// At build time, fetch all slugs to build the blog pages so they are static and cached
export async function generateStaticParams() {
  const allBlogs = await getAllBlogs();

  return allBlogs.map((blog: BlogProps) => ({
    slug: blog.slug,
  }));
}

export default async function BlogPage({ params }: { params: { slug: string } }) {
  const { isEnabled } = draftMode();
  const blog = await getBlog(params.slug, isEnabled);

  if (!blog) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-white">
      <section className="w-full">
        <div className="container space-y-12 px-4 md:px-6">
          <ContentfulPreviewProvider
            locale="en-US"
            enableInspectorMode={isEnabled}
            enableLiveUpdates={isEnabled}
          >
            <Blog blog={blog} />
          </ContentfulPreviewProvider>
        </div>
      </section>
    </main>
  );
}
