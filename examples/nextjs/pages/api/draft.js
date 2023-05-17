import { getPreviewPostBySlug } from "../../lib/api";

export default async function draft(req, res) {
  const { secret, slug } = req.query;

  // Check the secret and next parameters
  // This secret should only be known to this API route and Contentful
  if (secret !== process.env.CONTENTFUL_PREVIEW_SECRET || !slug) {
    return res.status(401).json({ message: "Invalid token" });
  }

  // Fetch the post to check if the provided `slug` exists
  const post = await getPreviewPostBySlug(slug);

  // If the slug doesn't exist prevent draft mode from being enabled
  if (!post) {
    return res.status(401).json({ message: "Invalid slug" });
  }

  // Enable Draft Mode by setting the cookie
  res.setDraftMode({ enable: true });

  // Redirect to the path from the fetched post
  // We don't redirect to req.query.slug as that might lead to open redirect vulnerabilities
  // res.writeHead(307, { Location: `/posts/${post.slug}` })
  const url = `/posts/${post.slug}`;
  res.setHeader("Content-Type", "text/html");
  res.write(
    `<!DOCTYPE html><html><head><meta http-equiv="Refresh" content="0; url=${url}" />
    <script>window.location.href = '${url}'</script>
    </head>
    </html>`
  );
  res.end();
}
