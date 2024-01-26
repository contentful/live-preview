import { decode } from '../csm/encode';
import { InspectorModeAttributes, InspectorModeDataAttributes } from './types';

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

  const sharedProps = {
    fieldId: element.getAttribute(InspectorModeDataAttributes.FIELD_ID) as string,
    locale: element.getAttribute(InspectorModeDataAttributes.LOCALE) ?? fallbackLocale,
    environment: element.getAttribute(InspectorModeDataAttributes.ENVIRONMENT) ?? undefined,
    space: element.getAttribute(InspectorModeDataAttributes.SPACE) ?? undefined,
  };

  const entryId = element.getAttribute(InspectorModeDataAttributes.ENTRY_ID);
  if (entryId) {
    return { ...sharedProps, entryId };
  }

  const assetId = element.getAttribute(InspectorModeDataAttributes.ASSET_ID);
  if (assetId) {
    return { ...sharedProps, assetId };
  }

  return null;
}

/**
 * Query the document for all tagged elements
 */
export function getAllTaggedElements(root = window.document, ignoreManual?: boolean): Element[] {
  // The fastest way to look up & iterate over DOM. Ref:
  // https://stackoverflow.com/a/2579869
  //
  // Terminology:
  // FILTER_SKIP: Skip the current node
  // FILTER_REJECT: Skip the current node and all its children
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL, (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';

      const decoded = decode(text);

      if (decoded?.origin !== 'contentful.com') {
        return NodeFilter.FILTER_SKIP;
      }

      return isTaggedElement(node.parentElement)
        ? ignoreManual
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP
        : NodeFilter.FILTER_ACCEPT;
    }

    if (ignoreManual) {
      return NodeFilter.FILTER_SKIP;
    }

    return isTaggedElement(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
  });

  const elements: Element[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;

    if (node.nodeType === Node.ELEMENT_NODE) {
      elements.push(walker.currentNode as Element);
      continue;
    }

    if (!node.textContent) {
      continue;
    }
    // Handle Encoded strings
    const decoded = decode(node.textContent);

    if (!decoded?.contentful) {
      continue;
    }

    const { contentful } = decoded;
    const el = node.parentElement;

    if (!el) {
      continue;
    }

    if (contentful.entityType === 'Entry') {
      el.setAttribute(InspectorModeDataAttributes.ENTRY_ID, contentful.entity);
    } else {
      el.setAttribute(InspectorModeDataAttributes.ASSET_ID, contentful.entity);
    }

    el.setAttribute(InspectorModeDataAttributes.LOCALE, contentful.locale);
    el.setAttribute(InspectorModeDataAttributes.FIELD_ID, contentful.field);
    el.setAttribute(InspectorModeDataAttributes.SPACE, contentful.space);
    el.setAttribute(InspectorModeDataAttributes.ENVIRONMENT, contentful.environment);

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
