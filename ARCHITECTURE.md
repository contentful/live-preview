# Architecture

## Purpose

This repository contains the libraries used by a preview website to communicate with Contentful, update preview content, expose inspector-mode metadata, and support timeline previews. The code is shipped as independently versioned npm packages from one TypeScript monorepo.

## System context

A customer application imports one or more packages from this repository. When the application is rendered inside Contentful's preview iframe, `@contentful/live-preview` exchanges validated `window.postMessage` events with the Contentful editor. The SDK can annotate or discover DOM elements for inspector mode and merge incoming content changes into the original REST or GraphQL response shape. The companion libraries provide response encoding and timeline-token utilities without owning the editor connection.

## Repository structure

- `packages/live-preview-sdk/` builds `@contentful/live-preview`, the main browser SDK and its React entry point.
- `packages/content-source-maps/` builds `@contentful/content-source-maps`, which encodes and decodes metadata used to associate rendered values with Contentful entities and fields.
- `packages/timeline-preview/` builds `@contentful/timeline-preview`, a small package for timeline-preview token creation and parsing.
- `examples/` demonstrates framework integrations including Next.js, Gatsby, Remix, Apollo, GraphQL, the Content Preview API, and vanilla JavaScript.
- `.circleci/config.yml` defines validation, release, and canary-release pipelines.
- `.github/` holds ownership, pull-request labeling, and workflow security configuration.

## Package relationships

`@contentful/live-preview` depends on `@contentful/content-source-maps` for encoding helpers used by its public live-update APIs. The timeline package is independent of the other workspace packages. React and React DOM are peer dependencies of the live-preview SDK and are externalized from its bundles.

Each package exposes source from `src/`, colocates tests under `src/` or `src/__tests__/`, and writes generated artifacts to `dist/`. Package export maps expose ESM and CommonJS builds plus TypeScript declarations. Vite and `vite-plugin-dts` produce these artifacts, while Vitest runs tests in `jsdom`.

## Main live-preview components

- `ContentfulLivePreview` is the main static API. It initializes the SDK, controls feature flags and locale, and coordinates browser integrations.
- `InspectorMode` manages tagged elements and editor interactions for selecting entries, assets, and fields.
- `LiveUpdates` receives editor updates and applies them to subscribed Contentful response data.
- `SaveEvent` coordinates save-related messaging.
- `messages.ts` and `helpers/validateMessage.ts` define and validate the cross-window protocol.
- `react.tsx` supplies the provider and hooks through the `@contentful/live-preview/react` entry point.

## Runtime boundaries and data flow

The live-preview package may be imported during server rendering, but interactive behavior starts only when a browser `window` exists and the page is inside an iframe. Initialization validates configuration, determines allowed Contentful origins, enables requested modules, registers the message listener, and announces the SDK to the editor. Incoming messages are validated before being forwarded to inspector, update, or save components. Subscribers then receive updated data, and React hooks publish it through component state.

Content-source-map functions operate on original Contentful REST or GraphQL response structures. Consumers should apply application-specific transformations after live updates because transformations can remove the identity and shape information needed to merge changes correctly.

## Build, validation, and release

Yarn workspaces install shared dependencies and Lerna runs package scripts. TypeScript uses strict checks with `NodeNext` module resolution. The normal validation path is linting, type checking, building, and Vitest execution. CircleCI runs those checks before publishing independently versioned packages from `main`; the `canary` branch produces prereleases. Lerna derives versions and release notes from conventional commits.

## Ownership and decisions

The Experience Assembly team owns the repository by default. Content Authoring and Publishing owns the timeline-preview package. Significant, durable architectural decisions are recorded under `docs/adr/`; see [ADR-0001](./docs/adr/0001-independent-packages-in-a-monorepo.md) for the current package and build model.
