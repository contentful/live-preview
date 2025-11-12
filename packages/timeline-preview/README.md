> ⚠️ **Timeline is only available on selected plans**

# Timeline

- Timeline enables marketers to plan and preview multiple upcoming content updates with ease. Each entry in the content model can hold several future versions, helping teams coordinate releases over time.
- This package exposes some utilities to parse the timeline token in the preview URL.

## Installation

Install the package:

```bash
npm install @contentful/timeline-preview
```

## How it works

- Setup your preview URL to contain the `{timeline}` token
- Add `@contentful/timeline-preview` to your application
- Use `parseTimelinePreviewToken` to get the information from the `{timeline}` token
- For more details about the CPA / GraphQL setup please have a look [here](https://www.contentful.com/help/timeline-preview-guide/)
