import jsonPointer from 'json-pointer';

import { Mappings } from './types';

export const isRichTextValue = (value: unknown): boolean =>
  !!(value && typeof value === 'object' && 'nodeType' in value && value.nodeType);

export const encodeRichTextValue = ({
  pointer,
  mappings,
  data,
  encodedValue,
}: {
  pointer: string;
  mappings: Mappings;
  data: any;
  encodedValue: string;
}) => {
  const source = mappings[pointer];
  // remove old pointer to rich text field as we will just be mapping the text nodes
  delete mappings[pointer];

  const textNodes = findRichTextNodes(data, pointer);
  for (const textNode of textNodes) {
    mappings[textNode] = source;
    const currentTextNodeValue = jsonPointer.get(data, textNode);
    jsonPointer.set(data, textNode, `${encodedValue}${currentTextNodeValue}`);
  }
};

const findRichTextNodes = (data: Node, currentPath = '/'): string[] => {
  const textNodes = [];
  const node = jsonPointer.get(data, currentPath);

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
