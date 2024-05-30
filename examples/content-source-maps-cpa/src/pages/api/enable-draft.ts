import { NextApiRequest, NextApiResponse } from 'next';
import { COOKIE_NAME_PRERENDER_BYPASS } from 'next/dist/server/api-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { secret } = req.query;

  // Check the secret and next parameters
  // This secret should only be known to this API route and Contentful
  if (secret !== process.env.CONTENTFUL_PREVIEW_SECRET) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // Enable Draft Mode by setting the cookie
  res.setDraftMode({ enable: true });
  // Override cookie header for draft mode for usage in live-preview
  // https://github.com/vercel/next.js/issues/49927
  // https://github.com/vercel/next.js/blob/62af2007ce78fdbff33013a8145efbcacbf6b8e2/packages/next/src/server/api-utils/node.ts#L293
  const headers = res.getHeader('Set-Cookie');
  if (Array.isArray(headers)) {
    res.setHeader(
      'Set-Cookie',
      headers.map((cookie: string) => {
        if (cookie.includes(COOKIE_NAME_PRERENDER_BYPASS)) {
          return cookie.replace('SameSite=Lax', 'SameSite=None; Secure');
        }
        return cookie;
      }),
    );
  }

  const url = `/`;
  res.setHeader('Location', url);
  return res.status(307).end();
}
