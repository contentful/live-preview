> ⚠️ **Content Source Maps are only available on our Premium plan. Vercel Content Links are only available on Vercel Pro and Enterprise plans.**

# Next.js Pages Router Content Preview API (REST) Content Source Maps example

This is an example project that demonstrates how to use Content Source Maps with a Next.js Pages Router application. It is using the Content Preview API (REST) of Contentful.

## What?

[Inspector mode](https://www.contentful.com/developers/docs/tutorials/general/live-preview/) helps to simplify navigation within complex content structures. However, setup costs for complex pages can be time-consuming. To address this, Content Source Maps automates tagging and enables integration with [Vercel’s Content Links](https://vercel.com/docs/workflow-collaboration/edit-mode#content-link) feature, enhancing usability and collaboration.

## How?

It uses the [Contentful JS Client SDK](https://github.com/contentful/contentful.js) to fetch Content Source Maps for preview content. The SDK will return with the content that includes the hidden metadata to enable live preview inspector mode and Vercel Content Links.

We are also using live updates by passing the encoded result into `useContentfulLiveUpdates`.

For more information around Content Source Maps check out the [README](https://github.com/contentful/live-preview/tree/main/packages/content-source-maps) for Content Source Maps.
