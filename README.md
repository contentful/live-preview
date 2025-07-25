# @contentful/live-preview

Live preview SDK for both the inspector mode connection + live content updates by [Contentful](https://www.contentful.com/).

> [!IMPORTANT]
> :rocket: **Major Performance Boost for Live Updates!** (2025-02-26)
>
> We've drastically improved Live Updates, making them up to **14× faster** for complex, nested content models. Previously, these updates could take several seconds—now, with our new technical approach, they happen almost instantly.
> Enjoy a smoother, more responsive experience! :dash::sparkles:
>
> (Requirement: @contentful/live-preview >= 3.0.0)

<details>
<summary>Table of contents</summary>

<!-- TOC -->

- [Getting started](#getting-started)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Initializing the SDK](#initialize-the-sdk)
    - [Init Configuration](#init-configuration)
    - [Overriding Locale](#overriding-locale)
  - [Inspector Mode](#inspector-mode-field-tagging)
  - [Live Updates](#live-updates)
    - [Live Updates with GraphQL](#live-updates-with-graphql)
- [Example Integrations](#example-integrations)
  - [JavaScript](#vanilla-javascript)
  - [Next.js](#integration-with-nextjs)
  - [Gatsby](#integrating-with-gatsby)
  - [Further Examples](#further-examples)
- [Documentation](#documentation)
- [Code of Conduct](#code-of-conduct)
- [License](#license)
<!-- /TOC -->

</details>

## Getting started

### Requirements

- Node.js: `>=16.15.1`

To install live preview simply run one of the following commands.

### Installation

```bash
yarn add @contentful/live-preview
```

or

```bash
npm install @contentful/live-preview
```

### Initializing the SDK

To establish a communication between your preview frontend and Contentful, you simply need to initialize the live preview SDK. This can be done by executing the following command:

```jsx
import { ContentfulLivePreview } from '@contentful/live-preview';

...

ContentfulLivePreview.init({ locale: 'en-US'});
```

#### Init Configuration

The init command also accepts a configuration object that allows you to customize your live preview SDK experience. The following options are available:

```jsx
import { ContentfulLivePreview } from '@contentful/live-preview';

...

ContentfulLivePreview.init({
  locale: 'set-your-locale-here', // This is required and allows you to set the locale once and have it reused throughout the preview
  enableInspectorMode: false, // This allows you to toggle the inspector mode which is on by default
  enableLiveUpdates: false, // This allows you to toggle the live updates which is on by default
  debugMode: false, // This allows you to toggle the debug mode which is off by default
  targetOrigin: 'https://app.contentful.com', // This allows you to configure the allowed host of the live preview (default: ['https://app.contentful.com', 'https://app.eu.contentful.com'])
});
```

#### Overriding Locale

It is possible to override the locale you set in the init command for a more flexible workflow. If you need to override the locale you can do so either in the getProps command like below:

```jsx
ContentfulLivePreview.getProps({ entryId: id, fieldId: 'title', locale: 'fr' });
```

You can also override it when using our useContentfulLiveUpdates hook like below:

```tsx
import { useContentfulLiveUpdates } from '@contentful/live-preview/react';

// ...
const updated = useContentfulLiveUpdates(originalData, { locale });
// ...
```

### Inspector Mode (field tagging)

To use the inspector mode, you need to tag fields by adding the live preview data-attributes (`data-contentful-entry-id`, `data-contentful-asset-id`, `data-contentful-field-id`) to the rendered HTML element output.

You can do this in React via our helper function.

```jsx
import { ContentfulLivePreview } from '@contentful/live-preview';
...

<h1 {...ContentfulLivePreview.getProps({ entryId: id, fieldId: 'title' })}>
  {title}
</h1>
```

### Live Updates

Live updates allow you to make changes in your editor and see the updates in real time. The updates are only happening on the **client-side** and in the live preview environment of [Contentful](https://app.contentful.com).
**Note:** Currently transformations of Contentful response data are not supported. In order for live updates to work as intended, Contentful data must be kept in its **original structure**.

```tsx
import { useContentfulLiveUpdates } from '@contentful/live-preview/react';

// ...
const updated = useContentfulLiveUpdates(originalData);
// ...
```

### Live updates with GraphQL

For the best experience of live updates together with GraphQL, we recommend to provide your query information to `useContentfulLiveUpdates`.
This will benefit the performance of updates and provides support for GraphQL features (e.g. `alias`).

```tsx
import gql from 'graphql-tag';

const query = gql`
  query posts {
    postCollection(where: { slug: "${slug}" }, preview: true, limit: 1) {
      items {
        __typename
        sys {
          id
        }
        slug
        title
        content: description
      }
    }
  }
`;

// ...
const updated = useContentfulLiveUpdates(originalData, { query });
// ...
```

### Open Entry or Asset in Editor

`ContentfulLivePreview.openEntryInEditor({fieldId: string, entryId: string, locale: string})`

Opens an entry in the Contentful live preview editor. This utility function allows for manual control over the editor opening process, providing flexibility for developers to integrate this action within custom UI components or events.

- **fieldId** (string): The ID of the field you want to target.
- **entryId** (string): The ID of the entry containing the field.
- **assetId** (string): The ID of the asset containing the field.
- **locale** (string): The locale of the content.

**Usage**:

```javascript
ContentfulLivePreview.openEntryInEditor({
  entryId: 'entryId',
  fieldId: 'fieldId',
  locale: 'en-US',
});
```

## Known issues and limitations

### General

- If the live preview SDK is used inside of another iframe than in the contentful app, it might produce errors as it can't detect the host.
  To remove the error, you have to define the `targetOrigin` manually. ([Init Configuration](#init-configuration))

### Live updates limitations:

- GraphQL filters (e.g. filters in the Array field type) or filtering using the [select query parameter](https://www.contentful.com/developers/docs/references/content-preview-api/#/reference/search-parameters/select-operator) on the Content Preview API (CPA).
- We currently do not support multiple locales within a single GraphQL query or a single CPA response.
- Live updates works only with untransformed data. Ensure that the response from the CPA or GraphQL is provided to the hook in its original form, with any potential transformations applied afterwards.

## Example Integrations

### Vanilla Javascript

You can find an example in the [examples/vanilla-js](./examples/vanilla-js/) folder.

Before you initialize live preview SDK you'll want to make whatever call (REST or GraphQL API) to get the entries and assets that make up the page being requested.

To use the Contentful Live Preview SDK with [Javascript], you can use the following steps to add it to an existing project.

1. Add the @contentful/live-preview package to your project

```bash
yarn add @contentful/live-preview
```

or

```bash
npm install @contentful/live-preview
```

2. Once you've got the data from Contentful, then you can initialize the live preview. You can use the `ContentfulLivePreview` class' [init function](#init-configuration).

```html
<!doctype html>
<html lang="en">
  <head>
    <title>Live Preview Example</title>
    <script type="module">
      import { ContentfulLivePreview } from '@contentful/live-preview';

      ContentfulLivePreview.init({ locale: 'en-US' });
    </script>
  </head>
  <body></body>
</html>
```

3. Then for each entry and field on which you want to use the inspector mode to show an edit button in the preview, you'll need to tag the HTML elements with the appropriate data attributes. The data attributes are `data-contentful-entry-id` and `data-contentful-field-id`. If you want to override the global locale from the init function, you can set `data-contentful-locale`.

You can use the provided helper function `getProps()`.

```html
<!doctype html>
<html lang="en">
  <head>
    <title>Live Preview Example</title>
    <script type="module">
      import { ContentfulLivePreview } from '@contentful/live-preview';

      ContentfulLivePreview.init({ locale: 'en-US' });

      const heading = document.getElementById('demo');

      /*
       * Example response
       *
       * const props = {
       *   'data-contentful-field-id': 'fieldId',
       *   'data-contentful-entry-id': 'entryId',
       *   'data-contentful-locale': 'en-US',
       *   }
       */
      const props = ContentfulLivePreview.getProps({ entryId: id, fieldId: title });

      for (const [key, value] of Object.entries(props)) {
        // change from hyphen to camelCase
        const formattedName = key.split('data-')[1].replace(/-([a-z])/g, function (m, w) {
          return w.toUpperCase();
        });

        heading.dataset[formattedName] = value;
      }
    </script>
  </head>
  <body>
    <h1 id="demo">Title</h1>
  </body>
</html>
```

4.To use the live updates feature you will have to subscribe for changes for **each** entry/asset, to get updates when a field is edited in Contentful.

```html
<!doctype html>
<html lang="en">
  <head>
    <title>Live Preview Example</title>
    <script type="module">
      import { ContentfulLivePreview } from '@contentful/live-preview';

      const locale = 'en-US';

      ContentfulLivePreview.init({ locale });

      /**
       * Subscribe to data changes from the Editor, returns a function to unsubscribe
       * Will be called once initially for the restored data
       */
      const unsubscribe = ContentfulLivePreview.subscribe({
        data, //the JSON response from the CPA for an entry/asset or an array of entries (or assets)
        locale,
        callback, //is a function to be called when the entry/asset is updated in Contentful to tell the frontend to update the preview. This callback is what makes the frontend update almost instantaneously when typing in a field in the editor.
      });
    </script>
  </head>
  <body></body>
</html>
```

That's it! You should now be able to use the Contentful Live Preview SDK with vanilla JS.

### React

#### Requirements

- React.js >=17

#### Integration with Next.js

You can find an example for the NextJS Pages Router implementation in the [examples/nextjs-graphql](./examples/nextjs-graphql/) folder.
If you are using the app router you can look at this [example](./examples/nextjs-13-app-router-graphql/) or for using react server components only, use this [example](./examples/next-app-router-rsc/) instead.

To use the Contentful Live Preview SDK with [Next.js](https://nextjs.org), you can either use one of the Contentful starter templates, or do the following steps to add it to an existing project.

1. Add the @contentful/live-preview package to your project

```bash
yarn add @contentful/live-preview
```

or

```bash
npm install @contentful/live-preview
```

2. Initialize the SDK with the `ContentfulLivePreviewProvider` and add the stylesheet for field tagging inside `_app.tsx` or `_app.js`.
   The `ContentfulLivePreviewProvider` accepts the same arguments as the [init function](#init-configuration).

```tsx
import { ContentfulLivePreviewProvider } from '@contentful/live-preview/react';

const CustomApp = ({ Component, pageProps }) => (
  <ContentfulLivePreviewProvider locale="en-US">
    <Component {...pageProps}>
  </ContentfulLivePreviewProvider>
)
```

This provides the possibility to only enable live updates and inspector mode inside draft mode:

```tsx
import { ContentfulLivePreviewProvider } from '@contentful/live-preview/react';

const CustomApp = ({ Component, pageProps }) => (
  <ContentfulLivePreviewProvider
    locale="en-US"
    enableInspectorMode={pageProps.draftMode}
    enableLiveUpdates={pageProps.draftMode}>
    <Component {...pageProps} />
  </ContentfulLivePreviewProvider>
);
```

3. Add field tagging and live updates to your component

```tsx
export default function BlogPost: ({ blogPost }) {
  const inspectorProps = useContentfulInspectorMode()
  // Live updates for this component
  const data = useContentfulLiveUpdates(
    blogPost
  );

  return (
    <Section>
      <Heading as="h1">{data.heading}</Heading>
      {/* Text is tagged and can be clicked to open the editor */}
      <Text
        as="p"
        {...inspectorProps({
          entryId: data.sys.id,
          fieldId: 'text',
        })}>
        {data.text}
      </Text>
    </Section>
  );
}
```

> It doesn't matter if the data is loaded with getServerSideProps, getStaticProps or if you load it in any other way.<br>It's necessary that the provided information to `useContentfulLiveUpdate` contains the `sys.id` for identification and only non-transformed fields can be updated.<br>(For GraphQL also the `__typename` needs to be provided)

**Tip:** If you want to tag multiple fields of an entry, you can also provide initial arguments to the hook:

```tsx
export default function BlogPost: ({ blogPost }) {
  const inspectorProps = useContentfulInspectorMode({ entryId: data.sys.id })

  return (
    <Section>
      <Heading as="h1" {...inspectorProps({ fieldId: 'heading' })}>{data.heading}</Heading>
      <Text as="p" {...inspectorProps({ fieldId: 'text' })}>
        {data.text}
      </Text>
    </Section>
  )
}
```

4. Enable draft mode

We suggest using the [draft mode](https://nextjs.org/docs/pages/building-your-application/configuring/draft-mode) and the [Content Preview API](https://www.contentful.com/developers/docs/references/content-preview-api/) for the best experience.

For a full guide checkout this [free course](https://www.contentful.com/nextjs-starter-guide/)

> Due some security settings the draft mode is not always shared with the iframe.<br>You can find a workaround in our [examples](./examples/nextjs-graphql/pages/api/draft.ts#L25)

5. In Contentful, configure the draft URL for your Next.js application in the Content preview settings. Once you open an entry with a configured preview URL, you can use the live preview and all its features.

That's it! You should now be able to use the Contentful live preview SDK with Next.js.

#### Integrating with Gatsby

🚧 **Please be aware that Gatsby support is currently limited. While Inspector Mode is operational, there is a known issue with live updates not functioning as expected.**

`gatsby-source-contentful` applies transformations to data received from Contentful, which affects the functionality of live updates. To ensure live updates operate properly, it's essential that Contentful data maintains its original structure. However, Inspector Mode remains fully compatible with Gatsby:

```jsx
export default function Hero({ data }) {
  const inspectorProps = useContentfulInspectorMode();

  return (
    <Section>
      {/* Text is tagged and can be clicked to open the editor */}
      <Text
        as="p"
        {...inspectorProps({
          entryId: data.contentful_id,
          fieldId: 'text',
        })}>
        {data.text}
      </Text>
    </Section>
  );
}
```

For an example of inspector mode with Gatsby, you can checkout out the [examples directory](./examples/gatsby).

### Further Examples

For further examples see the [./examples](./examples/) directory.

## Documentation

- [Developer Documentation](https://www.contentful.com/developers/docs/tutorials/general/live-preview/)

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
