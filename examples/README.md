# Example Projects Overview

This README provides a comprehensive overview of our various example projects to assist you in selecting the most appropriate example based on your specific requirements.

## next-app-router (recommended)

This example uses a combination of [react server and client components](https://nextjs.org/docs/app/getting-started/server-and-client-components). The data is initially fetched in a server component and passed to a client component. The client component then imports the Live Preview SDK and the live updates hook, which handles rehydrating the page to enable real-time updates.

## next-app-router-rsc

This example _only_ uses [react server components](https://nextjs.org/docs/app/getting-started/server-and-client-components). A lightweight standalone script initializes the Live Preview SDK and triggers revalidation via a specified endpoint whenever changes are saved in Contentful. Your preview site is automatically reloaded following each auto-save event, which occurs every 5 seconds.

## next-pages-router

This example demonstrates how to utilize the `@contentful/live-preview` SDK within a Next.js Pages Router setup.

## Remix

This example demonstrates how to utilize the `@contentful/live-preview` SDK within a Remix application.

## Vanilla JS

This example demonstrates how to utilize the `@contentful/live-preview` SDK within a straightforward Vanilla JavaScript environment.

## Gatsby

Currently, while Inspector Mode is operational in Gatsby, there is an issue with live updates. Due to Gatsby's unique processing of data from the Content Preview API / Contentful Sync API into its GraphQL schema, live updates via the Live Preview SDK are not supported.

## Content Source Maps GraphQL

This is an example project that demonstrates how to use Content Source Maps with the Contentful GraphQL API to enable automatic tagging for Inspector Mode. It uses Next.js App Router.

## Content Source Maps CPA

This is an example project that demonstrates how to use Content Source Maps with the Contentful Content Preview API (REST) to enable automatic tagging for Inspector Mode. It uses Next.js Pages Router.
