> ⚠️ **This feature is currently in alpha for selected customers.**

# Content Source Maps

Automatically add inspector mode to visual fields such as short text, rich text and assets, eliminating the time and effort required for manually inserting data attributes.

## Installation

Install the Live Preview SDK:

```bash
npm install @contentful/live-preview
```

## How it works

The Live Preview SDK transforms the Content Source Maps coming from either the GraphQL API or Content Preview API (REST) into hidden metadata. This process employs steganography to conceal metadata within invisible Unicode characters, containing information to activate inspector mode. These invisible Unicode characters will not alter the visual presentation of your content.

### GraphQL

#### 1. Initialize the Live Preview SDK

```jsx
import { ContentfulLivePreviewProvider } from '@contentful/live-preview/react';

const CustomApp = ({ Component, pageProps }) => (
  <ContentfulLivePreviewProvider locale="en-US">
    <Component {...pageProps}>
  </ContentfulLivePreviewProvider>
)
```

#### 2. Setting Up GraphQL Queries

Enable Content Source Maps in your GraphQL queries as follows:

```graphql
query @contentSourceMaps {
  postCollection(preview: true) {
    items {
      title
    }
  }
}
```

The GraphQL API will now return the data along with the Content Source Maps in the `extensions` field.

#### 3. Processing GraphQL Response

Then, pass the data to the provided function `encodeGraphQLResponse` to encode the response:

```jsx
import { encodeGraphQLResponse } from '@contentful/live-preview';

const dataWithAutoTagging = encodeGraphQLResponse(data);
```

When rendering the encoded data in your website, inspector mode will activate automatically.

### REST (Content Preview API)

#### 1. Initialize the Live Preview SDK

```jsx
import { ContentfulLivePreviewProvider } from '@contentful/live-preview/react';

const CustomApp = ({ Component, pageProps }) => (
  <ContentfulLivePreviewProvider locale="en-US">
    <Component {...pageProps}>
  </ContentfulLivePreviewProvider>
)
```

#### 2. Enable Content Source Maps for the CPA

To enable Content Source Maps using the [Contentful Client SDK](https://github.com/contentful/contentful.js), simply enable `includeContentSourceMaps` in the client:

```jsx
export const clientPreview = createClient({
  space: process.env.CONTENTFUL_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN!,
  host: "preview.contentful.com",
  alphaFeatures: {
    includeContentSourceMaps: true
  }
});
```

Inspector mode will now activate automatically. Please make sure to use Contentful.js version v10.11.0 or above.

## Troubleshooting / Tips

- Under certain circumstances, such as when applying letter-spacing in CSS, fields may display styles that weren't intended. In these cases, you can utilize the `splitEncoding` function provided by the Live Preview SDK to retrieve the content and remove any hidden metadata.

  ```jsx
  import { splitEncoding } from '@contentful/live-preview';

  const { cleaned, encoded } = splitEncoding(text);
  ```

- Images will get automatically tagged if you provide an alt attribute with the asset title or description.

- To stop using manual tags while using Content Source Maps:

  ```jsx
  <ContentfulLivePreviewProvider experimental={{ ignoreManuallyTaggedElements: true }} />
  ```

## Limitations

- Markdown support is currently in development.
- Adding hidden metadata to content can result in problems, e.g. when being used for CSS values, for dates or URL content. You can remove the hidden strings using the `splitEncoding` function from the Live Preview SDK.
- Encoding will be skipped on these formats:
  - Any date format that does not use English letters (e.g. `4/30/24`)
  - ISO dates (e.g. `2024-04-30T12:34:59Z`)
  - URL’s

