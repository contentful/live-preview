/*
  We have to make this a client component to use the `useContentfulLiveUpdates` hook to enable live preview mode.
  This does not mean it is rendered on the client, but that the HTML, CSS and JavaScript are shipped to the client to hydrate the page.
  This is necessary because we need interactivity to enable live preview mode.
*/
'use client';

import { useContentfulLiveUpdates } from '@contentful/live-preview/react';
import { Post } from '../lib/api-graphql';

export const PostsRenderer = ({ posts }: { posts?: Post[] }) => {
  const updatedPosts = useContentfulLiveUpdates(posts);

  return (
    <ul>
      {updatedPosts &&
        updatedPosts.map((post, i) => (
          <li key={i}>
            <h1>{post.title}</h1>
          </li>
        ))}
    </ul>
  );
};
