# Next.js GraphQL Contentful live preview SDK example

This is an example project that demonstrates how to use the `@contentful/live-preview` SDK with a Next.js application that uses the GraphQL API. The live preview SDK provides live updates functionality for content changes and the inspector mode for your Contentful space.

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

`http://localhost:3000/api/draft?secret=<CONTENTFUL_PREVIEW_SECRET>&slug={entry.fields.slug}`

Replace `<CONTENTFUL_PREVIEW_SECRET>` with its respective value in `.env.local`.

## 5. Running the project locally

To run the project locally, you can use the `npm run dev` command. You can now use the live preview feature.
