import { Entry, createClient, EntryFieldTypes, EntrySys } from 'contentful';

type PostFields = {
  title: string;
  slug: string;
  description: string;
};

export type Post = {
  contentTypeId: 'post';
  fields: PostFields;
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

async function fetchEntry(query: object, draftMode = false): Promise<Entry<Post>> {
  const client = draftMode ? clientPreview : clientDelivery;
  const entries = await client.getEntries<Post>(query);
  return entries.items[0];
}

async function fetchEntries(query: object, draftMode = false): Promise<Entry<Post>[]> {
  const client = draftMode ? clientPreview : clientDelivery;
  const entries = await client.getEntries<Post>(query);
  return entries.items;
}

export async function getPost(slug: string, draftMode = false): Promise<Entry<Post>> {
  const entry = await fetchEntry(
    {
      'fields.slug': slug,
      content_type: 'post',
    },
    draftMode
  );
  return entry;
}

export async function getAllPostsWithSlug(): Promise<Entry<Post>[]> {
  const entries = await fetchEntries({
    'fields.slug[exists]': true,
    content_type: 'post',
  });
  return entries;
}

export async function getAllPostsForHome(draftMode = false): Promise<Entry<Post>[]> {
  const entries = await fetchEntries(
    {
      content_type: 'post',
    },
    draftMode
  );
  return entries;
}
