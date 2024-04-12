import { get, set } from 'json-pointer';

import { combine } from './encode.js';
import type { SourceMapMetadata, CPAMappings, GraphQLMappings } from './types.js';

export const encodeRichTextValue = ({
  pointer,
  mappings,
  data,
  hiddenStrings,
}: {
  pointer: string;
  mappings: CPAMappings | GraphQLMappings;
  data: any;
  hiddenStrings: SourceMapMetadata;
}) => {
  const source = mappings[pointer];
  // remove old pointer to rich text field as we will just be mapping the text nodes
  delete mappings[pointer];

  const textNodes = findRichTextNodes(data, pointer);
  for (const textNode of textNodes) {
    mappings[textNode] = source;
    const currentTextNodeValue = get(data, textNode);
    const encodedValue = combine(currentTextNodeValue, hiddenStrings);
    set(data, textNode, encodedValue);
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
