import { redirect } from '@remix-run/node';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';

import { parseCookie } from '../../utils/parse-cookie.server';
import { previewModeCookie } from '../../utils/preview-mode.server';

export const loader: LoaderFunction = async () => {
  return redirect('/');
};

export const action: ActionFunction = async ({ request }) => {
  const cookie = await parseCookie(request, previewModeCookie);
  cookie.stage = 'published';

  return redirect(`/`, {
    headers: {
      'Set-Cookie': await previewModeCookie.serialize(cookie),
    },
  });
};
