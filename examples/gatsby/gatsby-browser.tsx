import React from 'react';
import { ContentfulLivePreviewProvider } from '@contentful/live-preview/react';

export const wrapRootElement = ({ element }) => (
  <ContentfulLivePreviewProvider locale="en-US">{element}</ContentfulLivePreviewProvider>
);
