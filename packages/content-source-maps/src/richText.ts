import { get, set } from 'json-pointer';

import { combine } from './encode.js';
import type { CPAMappings, GraphQLMappings, SourceMapMetadata } from './types.js';

export const encodeRichTextValue = ({
  pointer,
  mappings,
  data,
  hiddenStrings,
}: {
  pointer: string;
  mappings: CPAMappings | GraphQLMappings;
  data: Node;
  hiddenStrings: SourceMapMetadata;
}) => {
  const source = mappings[pointer];

  // Only proceed with mapping if we have a valid source
  if (source) {
    // We can now safely delete the original pointer as we've preserved the source
    delete mappings[pointer];

    const textNodes = findRichTextNodes(data, pointer);
    for (const textNode of textNodes) {
      mappings[textNode] = source;
      const currentTextNodeValue = get(data, textNode);
      const encodedValue = combine(currentTextNodeValue, hiddenStrings);
      set(data, textNode, encodedValue);
    }
  } else {
    // If there's no source mapping, just encode the text nodes without creating mappings
    const textNodes = findRichTextNodes(data, pointer);
    for (const textNode of textNodes) {
      const currentTextNodeValue = get(data, textNode);
      const encodedValue = combine(currentTextNodeValue, hiddenStrings);
      set(data, textNode, encodedValue);
    }
  }
};

const findRichTextNodes = (data: Node, currentPath = ''): string[] => {
  const textNodes = [];
  const node = get(data, currentPath);

  if (node.content) {
    for (let i = 0; i < node.content.length; i++) {
      if (node.content[i].nodeType === 'text') {
        textNodes.push(`${currentPath}/content/${i}/value`);
      } else {
        textNodes.push(...findRichTextNodes(data, `${currentPath}/content/${i}`));
      }
    }
  }

  return textNodes;
};
