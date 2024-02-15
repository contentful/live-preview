import { Entry, createClient, EntrySys, AssetSys, Asset } from 'contentful';

type BlogFields = {
  title: string;
  slug: string;
  summary: string;
  details: any;
  date: string;
  author: string;
  categoryName: string;
  heroImage: Asset;
};

export type Blog = {
  contentTypeId: 'blogPost';
  fields: BlogFields;
  sys: EntrySys;
};

const clientDelivery = createClient({
  space: process.env.CONTENTFUL_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
});

const clientPreview = createClient({
  space: process.env.CONTENTFUL_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN!,
  host: 'preview.contentful.com',
});

async function fetchEntry(query: object, draftMode = false): Promise<Entry<Blog>> {
  const client = draftMode ? clientPreview : clientDelivery;
  const entries = await client.getEntries<Blog>(query);
  return entries.items[0];
}

async function fetchEntries(query: object, draftMode = false): Promise<Entry<Blog>[]> {
  const client = draftMode ? clientPreview : clientDelivery;
  const entries = await client.getEntries<Blog>(query);
  return entries.items;
}

export async function getBlog(slug: string, draftMode = false): Promise<Entry<Blog>> {
  const entry = await fetchEntry(
    {
      'fields.slug': slug,
      content_type: 'blogPost',
    },
    draftMode,
  );
  return entry;
}

export async function getAllBlogsWithSlug(): Promise<Entry<Blog>[]> {
  const entries = await fetchEntries({
    'fields.slug[exists]': true,
    content_type: 'blogPost',
  });
  return entries;
}

export async function getAllBlogsForHome(draftMode = false): Promise<Entry<Blog>[]> {
  const entries = await fetchEntries(
    {
      content_type: 'blogPost',
    },
    draftMode,
  );
  return entries;
}
