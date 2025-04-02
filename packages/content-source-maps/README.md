> ⚠️ **Content Source Maps are only available on our Premium plan. Vercel Content Links are only available on Vercel Pro and Enterprise plans.**

# Content Source Maps

- Automatically add inspector mode to visual fields such as short text, rich text and assets, eliminating the time and effort required for manually inserting data attributes.
- Enables integration with [Vercel’s Content Links](https://vercel.com/docs/workflow-collaboration/edit-mode#content-link) feature, enhancing usability and collaboration.

## Installation

Install the Live Preview SDK:

```bash
npm install @contentful/live-preview
```

## How it works

The process employs steganography to conceal metadata within invisible Unicode characters, containing information to activate inspector mode. These invisible Unicode characters will not alter the visual presentation of your content.

### GraphQL

#### 1. Initialize the Live Preview SDK

This step is only required for Live Preview Inspector Mode (not for Vercel Content Links).

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

### Content Preview API (REST)

#### 1. Initialize the Live Preview SDK

This step is only required for Live Preview Inspector Mode (not for Vercel Content Links).

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

#### When not using the JS Client SDK: Direct CPA usage

Please be aware that without the Contentful Client SDK, certain protections, such as automatically requesting the required `sys.id`, are not enforced. To ensure Content Source Maps function properly, the complete `sys` object needs to be retrieved. Therefore, using a [select](https://www.contentful.com/developers/docs/references/content-preview-api/#/reference/search-parameters/select-operator) operator to exclude this from the response would cause errors.

Add `&includeContentSourceMaps=true` to the URL

```js
fetch("https://preview.contentful.com/spaces/:spaceId/environments/:envId/entries&includeContentSourceMaps=true",
 {
   method: "GET",
   headers: {
     Authorization: "Bearer YOUR_ACCESS_TOKEN",
     Content-Type: "application/json",
   },
 }
)
```

Use the `encodeCPAResponse` function from the Live Preview SDK by passing it the CPA Response with Content Source Maps. It will return with your content that includes the hidden metadata to enable inspector mode.

```jsx
import { encodeCPAResponse } from '@contentful/live-preview';

const dataWithAutoTagging = encodeCPAResponse(data);
```

## Combining Live Updates & Content Source Maps

If you’re using live updates and inspector mode with Content Source Maps together, then pass the encoded result into `useContentfulLiveUpdates`.

```jsx
import { encodeGraphQLResponse } from '@contentful/live-preview';
import { useContentfulLiveUpdates } from '@contentful/live-preview/react';

export default function Page({ initialGraphQLResponse }) {
  // 1. Encode the full response first (including extensions):
  const encoded = encodeGraphQLResponse(initialGraphQLResponse);
  // 2. Then pass that encoded data to the live updates hook:
  const updated = useContentfulLiveUpdates(encoded);

  return <h1>{updated.data?.myEntry?.title}</h1>;
}
```

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

- For usage with @apollo/client, a custom link is needed to add the extensions to forward the extionsions to the response. [Example](../../examples/content-source-maps-apollo/lib/api-graphql.ts)

## Limitations

- Markdown support is currently in development.
- Adding hidden metadata to content can result in problems, e.g. when being used for CSS values, for dates or URL content. You can remove the hidden strings using the `splitEncoding` function from the Live Preview SDK.
- Encoding will be skipped on these formats:
  - Any date format that does not use English letters (e.g. `4/30/24`)
  - ISO dates (e.g. `2024-04-30T12:34:59Z`)
  - URL’s
