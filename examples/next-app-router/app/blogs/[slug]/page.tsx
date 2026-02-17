import { BlogProps, getAllBlogs, getBlog, getBrand } from '@/lib/contentful/api';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';
import { Blog } from '@/components/article';
import { ContentfulPreviewProvider } from '@/components/contentful-preview-provider';

// At build time, fetch all slugs to build the blog pages so they are static and cached

export default async function BlogPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { isEnabled } = await draftMode();
  const brand = await getBrand(params.slug);

  if (!brand) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-white">
      <section className="w-full">
        <div className="container space-y-12 px-4 md:px-6">
          <ContentfulPreviewProvider
            locale="en-US"
            debugMode={true}
            enableInspectorMode={false}
            enableLiveUpdates={true}
          >
            <Blog brand={brand} />
          </ContentfulPreviewProvider>
        </div>
      </section>
    </main>
  );
}
