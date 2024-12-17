import React from 'react';

export function PreviewBanner() {
  return (
    <>
      <p>You're in <strong>preview mode</strong> (DRAFT content from Contentful served)</p>
      <form action="/api/exit-preview" method="post">
        <button type="submit">Exit Preview Mode</button>
      </form>
    </>
  );
}
