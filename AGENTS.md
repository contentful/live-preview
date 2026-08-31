# AGENTS.md

This file gives coding agents the repository-specific context needed to make safe, reviewable changes.

## Repository overview

- This is a TypeScript monorepo for Contentful's live-preview libraries.
- Yarn workspaces and Lerna coordinate the packages under `packages/`.
- The public packages are `@contentful/live-preview`, `@contentful/content-source-maps`, and `@contentful/timeline-preview`.
- `packages/live-preview-sdk` owns inspector mode, editor messaging, live updates, and the React integration.
- `packages/content-source-maps` encodes Contentful REST and GraphQL responses with source-map metadata.
- `packages/timeline-preview` creates and parses timeline-preview tokens.
- `examples/` contains integration examples and is not part of the root workspace package list.

For a fuller map of the system, read [ARCHITECTURE.md](./ARCHITECTURE.md).

## Working in the repository

- Use the Node.js version in `.nvmrc` and Yarn Classic; install dependencies with `yarn install`.
- Run commands from the repository root unless a package-local command is specifically required.
- Build all packages with `yarn build`.
- Run static checks with `yarn lint` and `yarn tsc`.
- Run the non-interactive test suite with `yarn test:ci`; `yarn test` starts package test runners in their normal interactive mode.
- Use `yarn lerna run <script> --scope <package-name>` when a focused package command is sufficient.
- Do not hand-edit generated `dist/` output or package changelogs as part of a normal source change.

## Change guidelines

- Keep public APIs compatible unless the task explicitly calls for a breaking change.
- Preserve both ESM and CommonJS exports and generated TypeScript declarations when changing package entry points.
- Treat values received through `window.postMessage` as untrusted and retain origin and message validation.
- Keep browser-only access guarded so server-side imports of the SDK remain safe.
- Add or update colocated Vitest tests for behavior changes; tests use the `jsdom` environment.
- Update relevant package or root documentation when behavior visible to consumers changes.
- Follow the existing ESLint and Prettier configuration and use conventional commit messages.

## Review checklist

- Confirm the smallest relevant tests pass, then run `yarn lint`, `yarn tsc`, and `yarn build` when practical.
- Check package export maps and bundle externals if imports, entry points, or dependencies changed.
- Check that no credentials, Contentful access tokens, or customer content were added to fixtures or examples.
- Keep changes scoped; avoid unrelated formatting or dependency-lock updates.
- Follow `.github/CODEOWNERS`: Experience Assembly owns the repository generally, while Content Authoring and Publishing owns `packages/timeline-preview`.

## Architectural decisions

Decision records live in `docs/adr/`. Add a record when a change establishes a long-lived constraint, changes package boundaries or public entry points, or adopts repository-wide infrastructure.
