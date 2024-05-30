# Example Projects Overview

This README provides a comprehensive overview of our various example projects to assist you in selecting the most appropriate example based on your specific requirements.

## next-app-router (recommended)

- Client-Side Hydration: This setup integrates client components, facilitating the client-side hydration of HTML, CSS, and JavaScript. This feature enables the use of hooks for instant live updates directly in the browser.
- Real-Time Live Updates: Features a live update system that allows fields to dynamically update as edits are made, providing immediate feedback without requiring a save action.

## next-14-app-router-ssr

- Server-Side Rendering (SSR) Focus: This example exclusively utilizes server-side rendering, with minimal client-side interactions limited to loading the Live Preview SDK in a standalone script.
- Conditional Revalidation: Configured to trigger a revalidation process through a designated endpoint whenever changes are saved in Contentful, it then forcefully reloads the iframe, effective after 5-seconds..

## next-pages-router

- Integration with Pages Router: Demonstrates how to utilize the `@contentful/live-preview` SDK within a Next.js Pages Router setup.

## Remix

- Remix Framework Compatibility: Provides an example of how to integrate the `@contentful/live-preview` SDK with a Remix application.

## Vanilla JS

- Offers a basic demonstration of employing the `@contentful/live-preview` SDK within a straightforward Vanilla JavaScript environment.

## Gatsby

- Limited Gatsby Support: Currently, while Inspector Mode is operational in Gatsby, there is an issue with live updates. Due to Gatsby's unique processing of data from the Content Preview API into its GraphQL schema, live updates via the Live Preview SDK are not supported.

## Content Source Maps GraphQL

This is an example project that demonstrates how to use Content Source Maps with the Contentful GraphQL API to enable automatic tagging for Inspector Mode. It uses Next.js App Router.

## Content Source Maps CPA

This is an example project that demonstrates how to use Content Source Maps with the Contentful Content Preview API (REST) to enable automatic tagging for Inspector Mode. It uses Next.js Pages Router.
