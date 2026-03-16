/*
  We have to make this a client component to use the `useContentfulLiveUpdates` hook to enable live preview mode.
  This does not mean it is rendered on the client, but that the HTML, CSS and JavaScript are shipped to the client to hydrate the page.
  This is necessary because we need interactivity to enable live preview mode.
*/
'use client';

import { useContentfulLiveUpdates } from '@contentful/live-preview/react';
import { GET_ALL_POSTS_QUERY, Post } from '../lib/api-graphql';

const PostImage = ({ src, alt }: { src: string; alt: string }) => (
  <img src={src} alt={alt} style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
);

export const PostsRenderer = ({ posts }: { posts?: Post[] }) => {
  const updatedPosts = useContentfulLiveUpdates(posts, { query: GET_ALL_POSTS_QUERY });

  console.log('Updated posts:', updatedPosts);
  return (
    <ul>
      {updatedPosts &&
        updatedPosts.map((post, i) => (
          <li key={i}>
            <h1>{post.name}</h1>
            <hr style={{ margin: '16px 0', borderColor: '#ccc' }} />
            <p>Product Topic reference: {post.ref?.topicName}</p>
            {post.image?.src && <PostImage src={post.image.src} alt={post.name} />}
            {post.logo?.url && (
              <div>
                <p>Logo:</p>
                <PostImage src={post.logo.url} alt={`${post.name} logo`} />
              </div>
            )}
            {post.imagesCollection?.items && post.imagesCollection.items.length > 0 && (
              <div>
                <p>Images:</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {post.imagesCollection.items.map((img, idx) => (
                    <PostImage
                      key={img.sys.id}
                      src={img.source}
                      alt={`${post.name} image ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
            {post.ref?.featureImage?.src && (
              <div>
                <p>{'Product Topic > Feature Image > Src:'}</p>
                <PostImage src={post.ref.featureImage.src} alt={`${post.name} feature`} />
              </div>
            )}
            <hr style={{ margin: '16px 0', borderColor: '#ccc' }} />
            {post.ref?.featureImageWrapper && (
              <div>
                {post.ref.featureImageWrapper.title && (
                  <p>
                    {'Ref > Feature Image Wrapper > Title: '}
                    {post.ref.featureImageWrapper.title}
                  </p>
                )}
                {post.ref.featureImageWrapper.aliasedImage?.src && (
                  <>
                    <p>{'Ref > Feature Image Wrapper > Aliased Image > Src:'}</p>
                    <PostImage
                      src={post.ref.featureImageWrapper.aliasedImage.src}
                      alt={`${post.name} aliased`}
                    />
                  </>
                )}
              </div>
            )}
          </li>
        ))}
    </ul>
  );
};
