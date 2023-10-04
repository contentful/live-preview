import {
  useLoaderData,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import { ContentfulLivePreviewProvider } from '@contentful/live-preview/react';
import { json } from '@remix-run/node';
import { isPreviewMode } from './utils/preview-mode.server';
import type { LoaderFunction } from '@remix-run/node';

export const loader: LoaderFunction = async ({ request }) => {
  const preview = await isPreviewMode(request);

  return json({ preview });
};

export default function App() {
  const { preview } = useLoaderData<{ preview: boolean }>();

  return (
    <ContentfulLivePreviewProvider
      locale="en-US"
      enableInspectorMode={preview}
      enableLiveUpdates={preview}
    >
      <html lang="en">
        <head>
          <Meta />
          <Links />
        </head>
        <body>
          <main>
            <Outlet />
          </main>
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </body>
      </html>
    </ContentfulLivePreviewProvider>
  );
}
