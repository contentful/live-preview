import React from 'react';
import { ContentfulLivePreviewProvider } from '@contentful/live-preview/react';
import '@contentful/live-preview/style.css';

export const wrapRootElement = ({ element }) => (
  <ContentfulLivePreviewProvider locale="en-US">{element}</ContentfulLivePreviewProvider>
);
