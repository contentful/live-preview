import { decode, type SourceMapMetadata } from '@contentful/content-source-maps';
import { VERCEL_STEGA_REGEX } from '@vercel/stega';

import {
  InspectorModeAssetAttributes,
  InspectorModeAttributes,
  InspectorModeDataAttributes,
  InspectorModeEntryAttributes,
  InspectorModeSharedAttributes,
} from './types.js';
import { InspectorModeOptions } from './index.js';

export type AutoTaggedElement<T = Node> = {
  element: T;
  sourceMap: SourceMapMetadata;
};

interface TaggedElement {
  element: Element;
  attributes: InspectorModeAttributes | null;
}

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
 * Parses the necessary manually tagged information from the element and returns them.
 * If **one** of the information is missing it returns null
 */
export function getManualInspectorModeAttributes(
  element: Element,
  fallbackProps: Pick<InspectorModeAttributes, 'environment' | 'locale' | 'space'>,
): InspectorModeAttributes | null {
  if (!isTaggedElement(element)) {
    return null;
  }

  const sharedProps = {
    fieldId: element.getAttribute(InspectorModeDataAttributes.FIELD_ID) as string,
    locale: element.getAttribute(InspectorModeDataAttributes.LOCALE) ?? fallbackProps.locale,
    environment:
      element.getAttribute(InspectorModeDataAttributes.ENVIRONMENT) ?? fallbackProps.environment,
    space: element.getAttribute(InspectorModeDataAttributes.SPACE) ?? fallbackProps.space,
    manuallyTagged: true,
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

function getParent(
  child: Element,
  sourceMap: SourceMapMetadata,
  limit = 3,
): { element: Element; counters: { sameInformation: number; tagged: number; all: number } } | null {
  if (limit === 0) {
    return null;
  }

  const element = child.parentElement;
  if (element) {
    const counters = {
      sameInformation: 0,
      tagged: 0,
      all: 0,
    };

    let sibling = child.nextElementSibling;
    while (sibling) {
      const siblingSourceMap = decode(sibling.textContent || '');
      if (siblingSourceMap) {
        counters.tagged += 1;
        if (siblingSourceMap.href === sourceMap.href) {
          counters.sameInformation = +1;
        }
      }
      counters.all += 1;
      sibling = sibling.nextElementSibling;
    }

    const parentInformation = getParent(element, sourceMap, limit - 1);
    if (parentInformation && parentInformation.counters.sameInformation >= 1) {
      return parentInformation;
    }

    if (counters.sameInformation >= 1) {
      // at least one more siblings has the same information
      return { element, counters };
    }
  }

  return null;
}

export function findStegaNodes(container: HTMLElement) {
  let baseArray: HTMLElement[] = [];
  if (typeof container.matches === 'function' && container.matches('*')) {
    baseArray = [container];
  }

  return [
    ...baseArray,
    ...Array.from(container.querySelectorAll<HTMLElement>('*:not(script,style,meta,title)')),
  ]
    .map((node) => ({ node, text: getNodeText(node) }))
    .filter(({ text }) => !!(text && text.match(VERCEL_STEGA_REGEX)));
}

function getNodeText(node: HTMLElement): string {
  if (node.matches('input[type=submit], input[type=button], input[type=reset]')) {
    return (node as HTMLInputElement).value;
  }

  if (node.matches('img, video')) {
    return (node as HTMLImageElement).alt;
  }

  return Array.from(node.childNodes)
    .filter((child) => child.nodeType === Node.TEXT_NODE && Boolean(child.textContent))
    .map((c) => c.textContent)
    .join('');
}

function hasTaggedParent(node: HTMLElement, taggedElements: TaggedElement[]): boolean {
  for (const tagged of taggedElements) {
    if (tagged.element === node || tagged.element.contains(node)) {
      return true;
    }
  }

  return false;
}

/**
 * Query the document for all tagged elements
 */
export function getAllTaggedElements({
  root = window.document,
  options,
  ignoreManual,
}: {
  root?: any;
  options: Omit<InspectorModeOptions, 'targetOrigin'>;
  ignoreManual?: boolean;
}): {
  taggedElements: TaggedElement[];
  manuallyTaggedCount: number;
  automaticallyTaggedCount: number;
  autoTaggedElements: AutoTaggedElement<Element>[];
} {
  const alreadyTagged = ignoreManual
    ? []
    : root.querySelectorAll(
        `[${InspectorModeDataAttributes.ASSET_ID}][${InspectorModeDataAttributes.FIELD_ID}], [${InspectorModeDataAttributes.ENTRY_ID}][${InspectorModeDataAttributes.FIELD_ID}]`,
      );

  //Spread operator is necessary to convert the NodeList to an array
  const taggedElements: TaggedElement[] = [...alreadyTagged]
    .map((element: Element) => ({
      element,
      attributes: getManualInspectorModeAttributes(element, options),
    }))
    //filter out elements that don't have the necessary attributes
    .filter(({ attributes }) => attributes !== null);
  const elementsForTagging: AutoTaggedElement<Element>[] = [];

  const stegaNodes = findStegaNodes('body' in root ? root.body : root);

  for (const { node, text } of stegaNodes) {
    const sourceMap = decode(text);
    if (!sourceMap || !sourceMap.origin.includes('contentful.com')) {
      continue;
    }

    if (
      hasTaggedParent(node, taggedElements) ||
      elementsForTagging.some(
        (et) => et.element.contains(node) && isSameSourceMap(et.sourceMap, sourceMap),
      )
    ) {
      continue;
    }

    if (node.matches('img')) {
      const element = node.closest('figure') || node.closest('picture') || node;
      elementsForTagging.push({ element, sourceMap });
      continue;
    }

    // TODO: Performance optimisation: only do for richtext
    const wrapper = getParent(node, sourceMap);
    if (wrapper) {
      elementsForTagging.push({ element: wrapper.element, sourceMap: sourceMap });
    } else {
      // No sibling element with the same information, add the element directly
      elementsForTagging.push({ element: node, sourceMap: sourceMap });
    }
  }

  // Filter duplicate elements, so we don't tag them again and again
  const uniqElementsForTagging = elementsForTagging.filter(
    (el, index) => elementsForTagging.findIndex((et) => isSameElement(el, et)) === index,
  );

  for (const { element, sourceMap } of uniqElementsForTagging) {
    const attributes: InspectorModeSharedAttributes = {
      fieldId: sourceMap.contentful.field,
      locale: sourceMap.contentful.locale,
      space: sourceMap.contentful.space,
      environment: sourceMap.contentful.environment,
    };

    if (sourceMap.contentful.entityType === 'Asset') {
      (attributes as InspectorModeAssetAttributes).assetId = sourceMap.contentful.entity;
    } else if (sourceMap.contentful.entityType === 'Entry') {
      (attributes as InspectorModeEntryAttributes).entryId = sourceMap.contentful.entity;
    }

    taggedElements.push({
      element,
      attributes: attributes as InspectorModeAttributes,
    });
  }

  const autoTaggedCount = taggedElements.filter(
    ({ attributes }) => attributes?.manuallyTagged === false || !attributes?.manuallyTagged,
  ).length;

  return {
    taggedElements,
    manuallyTaggedCount: taggedElements.length - autoTaggedCount,
    automaticallyTaggedCount: autoTaggedCount,
    autoTaggedElements: uniqElementsForTagging,
  };
}

/**
 * Returns a list of tagged entries on the page
 */
export function getAllTaggedEntries({
  options,
}: {
  options: Omit<InspectorModeOptions, 'targetOrigin'>;
}): string[] {
  return [
    ...new Set(
      getAllTaggedElements({ options })
        .taggedElements.map((element: TaggedElement) => {
          if (element.attributes && 'entryId' in element.attributes) {
            return element.attributes.entryId;
          }
          return null;
        })
        .filter(Boolean) as string[],
    ),
  ];
}
