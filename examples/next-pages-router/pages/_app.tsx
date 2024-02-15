import '@/styles/globals.css';
import { ContentfulLivePreviewProvider } from '@contentful/live-preview/react';

import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ContentfulLivePreviewProvider locale="en-US">
      <Component {...pageProps} />
    </ContentfulLivePreviewProvider>
  );
}
