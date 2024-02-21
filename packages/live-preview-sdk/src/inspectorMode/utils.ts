import { decode } from '@contentful/content-source-maps';

import { InspectorModeAttributes, InspectorModeDataAttributes } from './types.js';

const isTaggedElement = (node?: Node | null): boolean => {
  if (!node) {
    return false;
  }

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
  fallbackLocale: string,
): InspectorModeAttributes | null {
  if (!isTaggedElement(element)) {
    return null;
  }

  const fieldId = element.getAttribute(InspectorModeDataAttributes.FIELD_ID) as string;
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
export function getAllTaggedElements(root = window.document, ignoreManual?: boolean): Element[] {
  // The fastest way to look up & iterate over DOM. Ref:
  // https://stackoverflow.com/a/2579869
  // Initialize a TreeWalker to traverse all nodes, using a filter function to determine which nodes to consider.
  // Terminology:
  // FILTER_SKIP: Skip the current node
  // FILTER_REJECT: Skip the current node and all its children
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL, (node) => {
    // If the node is a text node, decode its content.

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';

      // Decode the text content to check for Inspector Mode CSM
      const decoded = decode(text);

      // Skip the node if it does not have Inspector Mode CSM
      if (decoded?.origin !== 'contentful.com') {
        return NodeFilter.FILTER_SKIP;
      }

      return isTaggedElement(node.parentElement)
        ? ignoreManual
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP
        : NodeFilter.FILTER_ACCEPT;
    }

    // For non-text nodes, if ignoreManual is true, skip manually tagged elements.
    if (ignoreManual) {
      return NodeFilter.FILTER_SKIP;
    }

    // Accept the node if it is tagged according to the isTaggedElement function, else skip.
    return isTaggedElement(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
  });

  const elements: Element[] = [];

  // Iterate over the nodes accepted by the TreeWalker.
  while (walker.nextNode()) {
    const node = walker.currentNode;

    // Add element nodes directly to the elements array.
    if (node.nodeType === Node.ELEMENT_NODE) {
      elements.push(walker.currentNode as Element);
      continue;
    }

    // Skip nodes without text content.
    if (!node.textContent) {
      continue;
    }

    // Decode the text content for further processing.
    const decoded = decode(node.textContent);

    // Skip if the decoded CSM is not from Contentful.
    if (!decoded?.contentful) {
      continue;
    }

    const { contentful } = decoded;
    const el = node.parentElement;

    // Skip if the parent element does not exist.
    if (!el) {
      continue;
    }

    // Set attributes on the element based on the decoded CSM data.
    if (contentful.entityType === 'Entry') {
      el.setAttribute(InspectorModeDataAttributes.ENTRY_ID, contentful.entity);
    } else {
      el.setAttribute(InspectorModeDataAttributes.ASSET_ID, contentful.entity);
    }

    // TODO: add space/env ids to properly handle cross-space content
    el.setAttribute(InspectorModeDataAttributes.LOCALE, contentful.locale);
    el.setAttribute(InspectorModeDataAttributes.FIELD_ID, contentful.field);

    // Add the element to the elements array after setting attributes.
    elements.push(el);
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
        .filter(Boolean) as string[],
    ),
  ];
}
