import { GetStaticProps } from 'next';
import { Post, getAllPostsForHome } from '../../lib/api-rest';

const Index = ({ posts }: { posts: Post[] }) => {
  return (
    <>
      <ul>
        {posts &&
          posts.map((post, i) => (
            <li key={i}>
              <h1>{post.fields.title}</h1>
            </li>
          ))}
      </ul>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ draftMode = false }) => {
  const posts = await getAllPostsForHome(draftMode);
  return {
    props: { posts, draftMode },
  };
};

export default Index;
