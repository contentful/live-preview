# ADR-0001: Maintain independently versioned packages in one monorepo

- Status: Accepted
- Date: 2026-08-26

## Context

Live preview is delivered through several related libraries. The main SDK uses content-source-map functionality, while timeline preview provides a smaller independent capability. These packages share TypeScript, linting, test, and release conventions, and changes can span package boundaries. Consumers still need to install and update each public library independently.

The repository already uses Yarn workspaces, Lerna, Vite, and per-package export maps. This record documents that established design so future changes preserve its intended boundaries.

## Decision

We will keep the public libraries in a single Yarn and Lerna monorepo under `packages/`, with independent package versions.

Each package will:

- own its source, tests, manifest, build configuration, changelog, and public export map;
- publish ESM and CommonJS artifacts plus TypeScript declarations from `dist/`;
- expose only deliberate package entry points rather than internal source paths; and
- be releasable independently through Lerna's conventional-commit workflow.

Shared root configuration will define TypeScript, linting, formatting, dependency installation, and CI conventions. Cross-package functionality must be consumed through another package's public API and declared in the consumer's manifest. The React integration remains a secondary `@contentful/live-preview/react` export, with React and React DOM kept as peer dependencies and external bundle dependencies.

## Consequences

- Related changes can be reviewed and validated atomically in one repository.
- Tooling and CI behavior remain consistent across packages.
- Consumers can adopt content-source-map, live-preview, and timeline capabilities on separate release schedules.
- Contributors must consider dependency ranges and release impact when changing a shared package.
- Package boundaries, export maps, and CommonJS/ESM compatibility require explicit validation.
- Root-wide commands may do more work than a package-focused change needs, so Lerna scopes are appropriate for fast local feedback.

## Alternatives considered

### One combined package

This would simplify version coordination but would couple unrelated timeline and encoding use cases to the full browser SDK and its dependency surface.

### A repository for every package

This would isolate releases, but it would duplicate tooling and make coordinated SDK and content-source-map changes slower and harder to validate together.
