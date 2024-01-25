import { vercelStegaDecode } from '@vercel/stega';
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
  fallbackLocale: string
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
  //
  // Terminology:
  // FILTER_SKIP: Skip the current node
  // FILTER_REJECT: Skip the current node and all its children
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL, (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';

      const { origin, href } = (vercelStegaDecode(text) ?? {}) as Record<string, string>;

      if (origin !== 'contentful.com' || !href) {
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

    // Handle Encoded strings
    const { href } = (vercelStegaDecode(node.textContent ?? '') ?? {}) as Record<string, string>;
    const el = node.parentElement;

    if (!el) {
      continue;
    }

    // FIXME: maybe we should encode these attributes as separate attributes
    // in the encoded string?
    // const spaceId = href.match(/\/spaces\/([^/]+)\//)?.at(1);
    // const envId = href.match(/\/environments\/([^/]+)\//)?.at(1);
    const entryId = href.match(/\/entries\/([^/?]+)/)?.at(1);
    const assetId = href.match(/\/assets\/([^/?]+)/)?.at(1);

    const params = new URLSearchParams(href.split('?')[1]);
    const fieldId = params.get('focusedField');
    const localeCode = params.get('focusedLocale');

    if ((!entryId && !assetId) || !fieldId) {
      continue;
    }

    if (entryId) {
      el.setAttribute(InspectorModeDataAttributes.ENTRY_ID, entryId);
    }

    if (assetId) {
      el.setAttribute(InspectorModeDataAttributes.ASSET_ID, assetId);
    }

    if (localeCode) {
      el.setAttribute(InspectorModeDataAttributes.LOCALE, localeCode);
    }

    el.setAttribute(InspectorModeDataAttributes.FIELD_ID, fieldId);

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
        .filter(Boolean) as string[]
    ),
  ];
}
