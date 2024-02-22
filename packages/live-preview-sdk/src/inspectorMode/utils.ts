import { decode, type SourceMapMetadata } from '@contentful/content-source-maps';

import { InspectorModeAttributes, InspectorModeDataAttributes } from './types.js';

type AutoTaggedElement<T = Node> = {
  element: T;
  sourceMap: SourceMapMetadata;
};

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

function createSelector(key: InspectorModeDataAttributes, value: string) {
  return `[${key}="${value}"]`;
}

function hasTaggedParent(element: Element | null, sourceMap: SourceMapMetadata) {
  const selector = [
    createSelector(
      sourceMap.contentful.entityType === 'Asset'
        ? InspectorModeDataAttributes.ASSET_ID
        : InspectorModeDataAttributes.ENTRY_ID,
      sourceMap.contentful.entity,
    ),
    createSelector(InspectorModeDataAttributes.FIELD_ID, sourceMap.contentful.field),
    createSelector(InspectorModeDataAttributes.LOCALE, sourceMap.contentful.locale),
  ].join('');

  return element?.closest(selector);
}

function isImg(node: Node): node is HTMLImageElement {
  return node.nodeName === 'IMG';
}

/**
 * Parses the content of the node
 * For the `img` element use the information from `alt` otherwise use the `textContent`
 */
function getSourceMap(node: Node): SourceMapMetadata | null | undefined {
  if (isImg(node)) {
    return decode(node.alt);
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return decode(node.textContent || '');
  }

  return null;
}

/**
 * Check if both sourcemaps are identical
 * Based on how they're generated it's enough to check the URL
 */
function isSameSourceMap(a: SourceMapMetadata, b: SourceMapMetadata): boolean {
  return a.href === b.href;
}

/**
 * Validates that both elements & sourceMap informationare the same
 */
function isSameElement(a: AutoTaggedElement, b: AutoTaggedElement): boolean {
  if (!isSameSourceMap(a.sourceMap, b.sourceMap)) {
    return false;
  }

  if (a.element !== b.element) {
    return false;
  }

  return true;
}

/** Some elements don't makes sense to be tagged as they're not visible */
const IGNORE_TAGS = ['SCRIPT', 'HEAD'];

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
    // Ignore tags that are not visible on the page
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      IGNORE_TAGS.includes((node as HTMLElement).tagName)
    ) {
      return NodeFilter.FILTER_REJECT;
    }

    // Detect auto-tagged nodes
    const sourceMap = getSourceMap(node);
    if (sourceMap?.origin === 'contentful.com') {
      // Ignore if the parent is already tagged with the same information
      if (
        (isTaggedElement(node.parentElement) || hasTaggedParent(node.parentElement, sourceMap)) &&
        !ignoreManual
      ) {
        return NodeFilter.FILTER_SKIP;
      }
      return NodeFilter.FILTER_ACCEPT;
    }

    // For non-text nodes, if ignoreManual is true, skip manually tagged elements.
    if (ignoreManual) {
      return NodeFilter.FILTER_SKIP;
    }

    // Accept the node if it is tagged according to the isTaggedElement function, else skip.
    return isTaggedElement(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
  });

  const taggedElements: Element[] = [];
  const elementsForTagging: AutoTaggedElement<Element>[] = [];

  // Iterate over the nodes accepted by the TreeWalker.
  while (walker.nextNode()) {
    const node = walker.currentNode;

    // Add already tagged element nodes directly to the elements array.
    if (isTaggedElement(node)) {
      taggedElements.push(walker.currentNode as Element);
      continue;
    }

    // Decode the text content for further processing.
    const sourceMap = getSourceMap(node);

    // Skip if the decoded CSM is not from Contentful.
    if (!sourceMap?.contentful) {
      continue;
    }

    // Tag img tags directly, no need for further checks
    if (isImg(node)) {
      elementsForTagging.push({ element: node, sourceMap });
      continue;
    }

    // Skip if the parent element does not exist.
    const el = node.parentElement;
    if (!el) {
      continue;
    }

    // Skip if the parent is already selected for tagging with the same information
    if (
      elementsForTagging.some(
        (et) => et.element.contains(node) && isSameSourceMap(et.sourceMap, sourceMap),
      )
    ) {
      continue;
    }

    // Check if the sibling text nodes have the same information, if yes apply it on their wrapper element
    // TODO: perf improvement: if the csm contains the type information, we could do this only for rich-text
    const siblings = el.parentElement?.children;
    if (siblings && siblings.length > 1) {
      const taggedSiblings: string[] = [];

      for (const sibling of siblings) {
        const siblingSourceMap = decode(sibling.textContent || '');
        if (siblingSourceMap?.contentful) {
          taggedSiblings.push(siblingSourceMap.href);
        }
      }

      if (taggedSiblings.length > 1 && taggedSiblings.length !== new Set(taggedSiblings).size) {
        elementsForTagging.push({ element: el.parentElement, sourceMap: sourceMap });
        continue;
      }
    }

    // No sibling element with the same information, add the element directly
    elementsForTagging.push({ element: el, sourceMap: sourceMap });
  }

  // Filter duplicate elements, so we don't tag them again and again
  const uniqElementsForTagging = elementsForTagging.filter(
    (el, index) => elementsForTagging.findIndex((et) => isSameElement(el, et)) === index,
  );

  // Add the data- attributes to the auto-tagged elements
  // Do this after the tree walker is finished, otherwise the MutationObserver picks it already up again
  // and we have multiple tree walkers running parallel
  for (const { element, sourceMap } of uniqElementsForTagging) {
    if (sourceMap.contentful.entityType === 'Asset') {
      element.setAttribute(InspectorModeDataAttributes.ASSET_ID, sourceMap.contentful.entity);
    } else {
      element.setAttribute(InspectorModeDataAttributes.ENTRY_ID, sourceMap.contentful.entity);
    }
    element.setAttribute(InspectorModeDataAttributes.FIELD_ID, sourceMap.contentful.field);
    element.setAttribute(InspectorModeDataAttributes.LOCALE, sourceMap.contentful.locale);
    taggedElements.push(element);
  }

  return taggedElements;
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
