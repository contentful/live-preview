# Next.js App Router RSC example (using GraphQL)

This is an example project that demonstrates how to use the `@contentful/live-preview` SDK with a Next.js application that _only_ uses [React Server Component](https://nextjs.org/docs/app/getting-started/server-and-client-components)s

You will have to setup a revalidate endpoint in order for us to invalidate your page as shown [here](./app/api/revalidate/route.ts)

The live preview SDK will be initialised in a minimal standalone [script](./public/_live-preview.ts). Once a save event is detected (every 5 seconds) it will call your revalidation endpoint which will load the new changes on the page.

This example also enables the inspector mode.

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

- `slug` - short text
- `title` - short text
- `description` - short text
- `banner` - single media field

Once you've set up the `Post` content model, you can populate it with some example entries.

## 4. Setting up Content preview URL

In order to enable the live preview feature in your local development environment, you need to set up the Content preview URL in your Contentful space.

`http://localhost:3000/api/draft?secret=<CONTENTFUL_PREVIEW_SECRET>&slug={entry.fields.slug}`

Replace `<CONTENTFUL_PREVIEW_SECRET>` with its respective value in `.env.local`.

## 5. Running the project locally

To run the project locally, you can use the `npm run dev` command. You can now use the live preview feature.
