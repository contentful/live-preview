import { Entry, createClient, EntrySys } from 'contentful';

type PostFields = {
  title: string;
};

export type Post = {
  fields: PostFields;
  sys: EntrySys;
};

const clientDelivery = createClient({
  space: process.env.CONTENTFUL_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
});

export const clientPreview = createClient({
  space: process.env.CONTENTFUL_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN!,
  host: 'preview.contentful.com',
  includeContentSourceMaps: true,
});

async function fetchEntries(query: object, draftMode = false) {
  const client = draftMode ? clientPreview : clientDelivery;
  const entries = await client.getEntries(query);

  // Next.js can't stringify undefined for getStaticProps, and therefore we have to stringify+parse here
  return JSON.parse(JSON.stringify(entries.items));
}

export async function getAllPostsForHome(draftMode = false) {
  const entries = await fetchEntries(
    {
      content_type: 'post',
      include: 5,
    },
    draftMode,
  );
  return entries;
}
