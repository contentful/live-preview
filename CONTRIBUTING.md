# Contributing to `live-preview`

Please take a moment to review this document in order to make the contribution process easy and effective for everyone involved.

## Getting started

### Requirements

- Node.js: `>=16.15.0`
- Yarn: `>=1.21.1`

To install all dependencies and build all packages run the following commands from the root of the project.

```
yarn
yarn build
```

You are ready to go!


## Quality & Code Style

### Commit messages

All commit messages should meet the [conventional commit format](https://github.com/conventional-changelog/commitlint). The easiest way is to use `yarn cm` command which launches commit message wizard.

### Code formatting

You don't need to worry about formatting your code. It is automatically reformatted using `prettier` on every commit using Git hooks.

### Linting

We use [ESLint](https://eslint.org/) and [Typescript ESLint](https://github.com/typescript-eslint/typescript-eslint) for linting and checking code for errors.

All modern editors should automatically pick up configuration and show errors and warnings while you type.

#### Run ESLint for all packages

```bash
# at the monorepo root
yarn lint
```

### Checking types

#### Run Typescript checker for all packages

```bash
# at the monorepo root
yarn tsc
```

### Tests

We use [vitest](https://vitest.dev) and [Testing Library](https://testing-library.com/) for writing unit tests.

```bash
yarn test
```


#### Run all tests

```bash
yarn test:ci
```

#### Links

- [`@testing-library/react` documentation](https://testing-library.com/docs/react-testing-library/intro)
- [`vitest` documentation](https://vitest.dev/guide/)

