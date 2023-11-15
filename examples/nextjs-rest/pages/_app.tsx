import { ContentfulLivePreviewProvider } from '@contentful/live-preview/react';
import { AppProps } from 'next/app';

function App({ Component, pageProps }: AppProps) {
  return (
    <ContentfulLivePreviewProvider
      locale="en-US"
      enableInspectorMode={pageProps.draftMode}
      enableLiveUpdates={pageProps.draftMode}
    >
      <Component {...pageProps} />
    </ContentfulLivePreviewProvider>
  );
}

export default App;
