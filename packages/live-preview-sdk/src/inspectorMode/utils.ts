import { InspectorModeAttributes, InspectorModeDataAttributes } from './types';

const isTaggedElement = (node: Node): boolean => {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }

  const el = node as Element;

  if (!el.hasAttribute(InspectorModeDataAttributes.FIELD_ID)) {
    return false;
  }

  if (
    !el.hasAttribute(InspectorModeDataAttributes.ENTRY_ID) &&
    !el.hasAttribute(InspectorModeDataAttributes.ASSET_ID)
  ) {
    return false;
  }

  return true;
};

/**
 * Parses the necessary information from the element and returns them.
 * If **one** of the information is missing it returns null
 */
export function getInspectorModeAttributes(
  element: Element,
  fallbackLocale: string
): InspectorModeAttributes | null {
  if (!isTaggedElement(element)) {
    return null;
  }

  const fieldId = element.getAttribute(InspectorModeDataAttributes.FIELD_ID)!;
  const locale = element.getAttribute(InspectorModeDataAttributes.LOCALE) ?? fallbackLocale;

  const entryId = element.getAttribute(InspectorModeDataAttributes.ENTRY_ID);
  const assetId = element.getAttribute(InspectorModeDataAttributes.ASSET_ID);

  if (entryId) {
    return { entryId, fieldId, locale };
  }

  if (assetId) {
    return { assetId, fieldId, locale };
  }

  return null;
}

/**
 * Query the document for all tagged elements
 */
export function getAllTaggedElements(root = window.document): Element[] {
  // The fastest way to look up & iterate over DOM. Ref:
  // https://stackoverflow.com/a/2579869
  //
  // Terminology:
  // FILTER_SKIP: Skip the current node
  // FILTER_REJECT: Skip the current node and all its children
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL, (node) => {
    return isTaggedElement(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
  });

  const elements: Element[] = [];

  while (walker.nextNode()) {
    elements.push(walker.currentNode as Element);
  }

  return elements;
}

/**
 * Returns a list of tagged entries on the page
 */
export function getAllTaggedEntries(): string[] {
  return [
    ...new Set(
      getAllTaggedElements()
        .map((element) => element.getAttribute(InspectorModeDataAttributes.ENTRY_ID))
        .filter(Boolean) as string[]
    ),
  ];
}
