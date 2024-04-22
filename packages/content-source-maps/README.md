# Content Source Maps

Automatically tag visual fields such as short text, rich text and assets to streamline the setup process for Live Preview Inspector Mode, eliminating the time required for manually inserting data attributes to activate Inspector Mode.

## Installation

Install the Live Preview SDK:

```bash
npm install @contentful/live-preview
```

## How it works

The SDK transforms the Content Source Maps coming from either the GraphQL API or Content Preview API (REST) into hidden metadata. This process employs steganography to conceal metadata within invisible Unicode characters, thus not altering the visual presentation of your content.

### GraphQL

#### 1. Setting Up GraphQL Queries

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

The GraphQL API will return the data along with the Content Source Maps in the extensions field.

#### 2. Processing GraphQL Response

Use the provided function `encodeGraphQLResponse` to encode the response:

```jsx
import { encodeGraphQLResponse } from '@contentful/live-preview';

const dataWithAutoTagging = encodeGraphQLResponse(data);
```

### REST (Content Preview API)

#### 1. Enable Content Source Maps for the CPA

Enable Content Source Maps in the CPA response as follows:

```tsx
import { getEntries } from 'contentful';

const entries = await client.alpha_withContentSourceMaps.getEntries<Post>({
  // Include this: alpha_withContentSourceMaps
  include: includeLevel,
  ...query,
});
```

The CPA will return the data along with the Content Source Maps in the `sys` object.

#### 2. Processing CPA Response

Use the provided function `encodeCPAResponse` to encode the response:

```jsx
import { encodeCPAResponse } from '@contentful/live-preview';

const dataWithAutoTagging = encodeCPAResponse(data);
```

## Troubleshooting / Tips

- Under certain circumstances, such as when applying letter-spacing in CSS, fields may display styles that weren't intended. In these cases, you can utilize the functions provided by the Live Preview SDK to retrieve the content and remove any hidden metadata.

  ```jsx
  import { split } from '@contentful/live-preview';

  const { cleaned, encoded } = split(text);
  ```

- Images will get automatically tagged if you provide an alt attribute with the asset title or description.

- To stop using manual tags while using Content Source Maps:

  ```jsx
  <ContentfulLivePreviewProvider experimental={{ ignoreManuallyTaggedElements: true }} />
  ```

## Known Issues

- Markdown support is currently in development.
- Adding hidden metadata to content can result in problems, e.g. when being used for CSS values, for dates or URL content. We try to avoid this as much as possible but there might be some issues where the look & feel of the page is affected. You can remove the hidden strings using the `split` function from the SDK.
- Hidden strings will not be generated for fields that end with numeric values.
