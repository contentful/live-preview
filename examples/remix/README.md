# Remix Contentful live preview SDK example

This is an example project that demonstrates how to use the `@contentful/live-preview` SDK with a Remix application. The SDK provides live preview functionality for content changes and the inspector mode for your Contentful space.

The `@contentful/live-preview` SDK comes with its own CSS file, which needs to be included in your project. Due to how Remix treats static assets, you will need a build step to bundle and move the third-party CSS into your public directory. We have used esbuild for this.

## 1. Installation

Install the dependencies:

```bash
npm install
```

## 2. Environment variables

To run this project, you will need to add the following environment variables to your `.env.local` file:

- `CONTENTFUL_SPACE_ID`: This is the Space ID from your Contentful space.
- `CONTENTFUL_ACCESS_TOKEN`: This is the Content Delivery API - access token, which is used for fetching **published** data from your Contentful space.
- `CONTENTFUL_PREVIEW_ACCESS_TOKEN`: This is the Content Preview API - access token, which is used for fetching **draft** data from your Contentful space.
- `CONTENTFUL_PREVIEW_SECRET`: This can be any value you want. It must be URL friendly as it will be send as a query parameter to enable draft mode.

## 3. Setting up the content model

You will need to set up a content model within your Contentful space. For this project, we need a `Post` content type with the following fields:

- `slug`
- `title`
- `description`

Once you've set up the `Post` content model, you can populate it with some example entries.

## 4. Setting up Content preview URL

In order to enable the live preview feature in your local development environment, you need to set up the Content preview URL in your Contentful space.

`http://localhost:3000/api/preview?secret=<CONTENTFUL_PREVIEW_SECRET>&slug={entry.fields.slug}`

Replace `<CONTENTFUL_PREVIEW_SECRET>` with its respective value in `.env.local`.

## 5. Running the project locally

To run the project locally, you can use the `npm run dev` command. You can now use the live preview feature.

## 6. Common Issues and Their Solutions

### Issue with data manipulations in the loader

If you're running into issues with live preview updates when making data manipulations, it's essential to understand how and where the data manipulation happens.

For instance, in some scenarios, you might have something similar to:

```javascript
export async function loader({ context }: LoaderArgs) {
  const contentfulItems = data
    ? data?.entryCollection?.items[0]?.pageContentCollection?.items
    : undefined;

  return {
    contentful: contentfulItems,
  };
}
```

This approach has a drawback. Since the loader is being executed on the server, it will only happen once, meaning client-side data changes won't reflect here. Instead, move the logic into the component:

```javascript
export async function loader({ context }: LoaderArgs) {
  const contentfulItems = data ? data?.entryCollection?.items[0] : undefined;

  return {
    contentful: contentfulItems,
  };
}

export default function Homepage() {
    ...
    return (
      {contentfulData?.pageContentCollection?.items.map((item: IDataItem) => (
        <ContentfulComponent key={item.sys.id} item={item} />
      ))}
    )
}
```

By making this adjustment, the data manipulation happens at the component level, ensuring client-side changes are taken into account.
