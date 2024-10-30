import { draftMode } from 'next/headers';
import { getAllPostsForHome } from '../lib/api-graphql';

export default async function Home() {
  const { isEnabled } = draftMode();
  const posts = await getAllPostsForHome(isEnabled);

  return (
    <main>
      <ul>
        {posts &&
          posts.map((post, i) => (
            <li key={i}>
              <h1>{post.title}</h1>
            </li>
          ))}
      </ul>
    </main>
  );
}
