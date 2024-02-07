import { ContentfulLivePreview } from '@contentful/live-preview';

ContentfulLivePreview.init({
  locale: 'en-US',
  debugMode: true,
  enableLiveUpdates: true,
});

ContentfulLivePreview.subscribe('save', {
  callback: async () => {
    const pathname = window.location.pathname;

    return fetch(`/api/revalidate?pathname=${pathname}`);
  },
});
