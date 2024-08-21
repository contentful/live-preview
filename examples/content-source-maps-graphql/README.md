> ⚠️ **Content Source Maps are only available on our Premium plan. Vercel Content Links are only available on Vercel Pro and Enterprise plans.**

# Next.js App Router GraphQL Content Source Maps example

This is an example project that demonstrates how to use Content Source Maps with a Next.js App Router application. It is using the GraphQL API of Contentful.

## What?

[Inspector mode](https://www.contentful.com/developers/docs/tutorials/general/live-preview/) helps to simplify navigation within complex content structures. However, setup costs for complex pages can be time-consuming. To address this, Content Source Maps automates tagging and enables integration with [Vercel’s Content Links](https://vercel.com/docs/workflow-collaboration/edit-mode#content-link) feature, enhancing usability and collaboration.

## How?

It uses the GraphQL query level directive `@contentSourceMaps` to generate Content Source Maps for preview content. This content is parsed through the `encodeGraphQLResponse` function from the Live Preview SDK. It returns with the content that includes the hidden metadata to enable live preview inspector mode and Vercel Content Links.

For more information around Content Source Maps check out the [README](https://github.com/contentful/live-preview/tree/main/packages/content-source-maps) for Content Source Maps.
