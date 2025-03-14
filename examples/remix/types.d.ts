export type Post = {
  title: string;
  description: string;
  slug: string;
  sys: {
    id: string;
  };
};

export type LoaderData = {
  post: Post;
  posts: Post[];
  preview: boolean;
};

export type QueryResponse = {
  postCollection: {
    items: Post[];
  };
};

export type Variables = {
  [key: string]: string | boolean;
};
