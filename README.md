# @contentful/live-preview

> **Warning:** This package is currently in an **ALPHA** state (i.e., not suitable for production use and subject to breaking changes).

Preview SDK for both the field tagging connection + live content updates by [Contentful](https://www.contentful.com/).

It uses [Typescript](https://www.typescriptlang.org/), [React](https://reactjs.org/) and is bundled using [Vite](https://vitejs.dev/guide/build.html#library-mode).

## Getting started

### Requirements

- Node.js: `>=16.15.1`
- Yarn: `>=1.21.1`

To install live preview simply run one of the following commands.

```
yarn add @contentful/live-preview
```

or

```
npm install @contentful/live-preview
```

## Documentation

### Initializing the SDK

To establish a communication between your preview frontend and Contentful, you simply need to initialize the live preview SDK. This can be done by executing the following command:

```
import { ContentfulLivePreview } from '@contentful/live-preview';

...

ContentfulLivePreview.init();
```

### Field Tagging

To tag fields you need to add the live preview data-attributes to the rendered HTML element output.
You can do this in React via our helper function.
The necessary styles for the live edit tags can be found in the '@contentful/live-preview/dist/style.css' file.

```
import { ContentfulLivePreview } from '@contentful/live-preview';
import '@contentful/live-preview/dist/style.css';
...

<h1 {...ContentfulLivePreview.getProps({ entryId: id, fieldId: 'title', locale })}>
  {title}
</h1>
```

### Live Updates

Live Updates from the editor to your applications are currently only supported for [React.js](https://reactjs.org/)

```tsx
import { useContentfulLiveUpdates } from "@contentful/live-previews/dist/react"

// ...
const updated = useContentfulLiveUpdates(originalData, locale)
// ...
```

## Code of Conduct

We want to provide a safe, inclusive, welcoming, and harassment-free space and experience for all participants, regardless of gender identity and expression, sexual orientation, disability, physical appearance, socioeconomic status, body size, ethnicity, nationality, level of experience, age, religion (or lack thereof), or other identity markers.

[Read our full Code of Conduct](https://github.com/contentful-developer-relations/community-code-of-conduct).

## License

The live preview package is open source software [licensed as MIT](./LICENSE).

[contentful]: https://www.contentful.com
[github-issues]: https://github.com/contentful/live-preview/issues
[typescript]: https://www.typescriptlang.org/
[react]: https://reactjs.org/
[prettier]: https://prettier.io/
[eslint]: https://eslint.org/
[vite]: https://vitejs.dev/
