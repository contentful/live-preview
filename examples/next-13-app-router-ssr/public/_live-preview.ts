import { ContentfulLivePreview } from '@contentful/live-preview';

ContentfulLivePreview.init({ locale: 'en-US', debugMode: true, enableLiveUpdates: true });
ContentfulLivePreview.subscribe('save', {
  callback: () => {
    window.location.reload();
  },
});
