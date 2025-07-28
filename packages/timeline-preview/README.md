> ⚠️ **Timeline is currently in beta (preview center) and will be only available on Premium plan.**

# Timeline

- Timeline enables marketers to plan and preview multiple upcoming content updates with ease. Each entry in the content model can hold several future versions, helping teams coordinate releases over time.

## Installation

Install the Live Preview SDK:

```bash
npm install @contentful/timeline-preview
```

## How it works

- Setup your preview URL to contain the `{timeline}` token
- Add `@contentful/timeline-preview` to your application
- Use `parseTimelinePreviewToken` to get the information from the `{timeline}` token
- For more details about the CPA / GraphQL setup please have a look [here](https://www.contentful.com/help/timeline-preview-guide/)
