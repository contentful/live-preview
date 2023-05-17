import { ContentfulLivePreviewProvider } from "@contentful/live-preview/react";
import "@contentful/live-preview/style.css";

function App({ Component, pageProps }) {
  return (
    <ContentfulLivePreviewProvider locale="en-US" enableInspectorMode={pageProps.draftMode} enableLiveUpdates={pageProps.draftMode}>
      <Component {...pageProps} />
    </ContentfulLivePreviewProvider>
  );
}

export default App;
