import { NextApiRequest, NextApiResponse } from 'next';
import { getPreviewPostBySlug } from '../../lib/api-graphql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { secret, slug } = req.query;

  // Check the secret and next parameters
  // This secret should only be known to this API route and Contentful
  if (secret !== process.env.CONTENTFUL_PREVIEW_SECRET || !slug) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // Fetch the post to check if the provided `slug` exists
  const post = await getPreviewPostBySlug(slug as string);

  // If the slug doesn't exist prevent draft mode from being enabled
  if (!post) {
    return res.status(401).json({ message: 'Invalid slug' });
  }

  // Enable Draft Mode by setting the cookie
  res.setDraftMode({ enable: true });

  // Redirect to the path from the fetched post
  // We don't redirect to req.query.slug as that might lead to open redirect vulnerabilities
  const url = `/posts/${post.slug}`;
  res.setPreviewData({});
  let previous = res.getHeader('Set-Cookie');

  if (Array.isArray(previous)) {
    previous = previous.map((cookie: string) => {
      return cookie.replace('SameSite=Lax', 'SameSite=None;Secure');
    });
    res.setHeader('Set-Cookie', previous);
  }

  res.setHeader('Location', url);
  return res.status(307).end();
}
