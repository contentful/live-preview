'use client';

import { ContentfulLivePreviewProvider } from '@contentful/live-preview/react';
import { draftMode } from 'next/headers';
import { PropsWithChildren } from 'react';

export default function MyLivePreviewProvider({ children }: PropsWithChildren) {
  const { isEnabled } = draftMode();

  return (
    <ContentfulLivePreviewProvider
      locale="en-US"
      enableInspectorMode={isEnabled}
      enableLiveUpdates={isEnabled}>
      {children}
    </ContentfulLivePreviewProvider>
  );
}
