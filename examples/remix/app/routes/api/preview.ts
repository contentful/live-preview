import { gql } from 'graphql-request';
import { json, redirect } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node';

import { contentful } from '../../../lib/contentful.server';
import { previewModeCookie } from '../../utils/preview-mode.server';
import { parseCookie } from '../../utils/parse-cookie.server';

type QueryResponse = {
  postCollection: {
    items: {
      slug: string;
    }[];
  };
};

const getPostQuery = gql`
  query Post($slug: String!) {
    postCollection(where: { slug: $slug }, limit: 1, preview: true) {
      items {
        slug
      }
    }
  }
`;

export const loader: LoaderFunction = async ({ request }) => {
  const requestUrl = new URL(request?.url);
  const secret = requestUrl?.searchParams?.get('secret');
  const slug = requestUrl?.searchParams?.get('slug');

  // This secret should only be known to this API route and Contentful
  if (secret !== process.env.CONTENTFUL_PREVIEW_SECRET || !slug) {
    return json({ message: 'Invalid token' }, { status: 401 });
  }

  // Check if the provided `slug` exists
  const data = (await contentful.request(
    getPostQuery,
    { slug },
    {
      authorization: `Bearer ${process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN}`,
    }
  )) as QueryResponse;

  // If the slug doesn't exist prevent preview from being enabled
  if (!data.postCollection.items.length) {
    return json({ message: 'Invalid slug' }, { status: 401 });
  }

  // Enable preview by setting a cookie
  const cookie = await parseCookie(request, previewModeCookie);
  cookie.stage = 'draft';

  return redirect(`/${slug}`, {
    headers: {
      'Set-Cookie': await previewModeCookie.serialize(cookie),
    },
  });
};
