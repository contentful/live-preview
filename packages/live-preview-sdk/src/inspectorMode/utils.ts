import { decode, type SourceMapMetadata } from '@contentful/content-source-maps';
import { VERCEL_STEGA_REGEX } from '@vercel/stega';

import { debug } from '../helpers/debug.js';
import { InspectorModeOptions } from './index.js';
import {
  InspectorModeAssetAttributes,
  InspectorModeAttributes,
  InspectorModeDataAttributes,
  InspectorModeEntryAttributes,
  InspectorModeSharedAttributes,
} from './types.js';

export type AutoTaggedElement<T = Node> = {
  element: T;
  sourceMap: SourceMapMetadata;
};

interface PrecaulculatedTaggedElement {
  element: Element;
  attributes: InspectorModeAttributes | null;
}

export interface TaggedElement extends PrecaulculatedTaggedElement {
  isHovered: boolean;
  isVisible: boolean;
  coordinates: DOMRect;
  isCoveredByOtherElement: boolean;
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

  if (!sharedProps.fieldId) {
    debug.warn('Element is missing field ID attribute and cannot be tagged', {
      id:
        element.getAttribute(InspectorModeDataAttributes.ENTRY_ID) ??
        element.getAttribute(InspectorModeDataAttributes.ASSET_ID),
      sharedProps,
    });
    return null;
  }

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

function hasTaggedParent(
  node: HTMLElement,
  taggedElements: PrecaulculatedTaggedElement[],
): boolean {
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
}: {
  root?: any;
  options: Omit<InspectorModeOptions, 'targetOrigin'>;
}): {
  taggedElements: PrecaulculatedTaggedElement[];
  manuallyTaggedCount: number;
  automaticallyTaggedCount: number;
  autoTaggedElements: AutoTaggedElement<Element>[];
} {
  const alreadyTagged = options.ignoreManuallyTaggedElements
    ? []
    : root.querySelectorAll(
        `[${InspectorModeDataAttributes.ASSET_ID}][${InspectorModeDataAttributes.FIELD_ID}], [${InspectorModeDataAttributes.ENTRY_ID}][${InspectorModeDataAttributes.FIELD_ID}]`,
      );

  // Spread operator is necessary to convert the NodeList to an array
  const taggedElements: PrecaulculatedTaggedElement[] = [...alreadyTagged]
    .map((element: Element) => ({
      element,
      attributes: getManualInspectorModeAttributes(element, options),
    }))
    // Filter out elements that don't have the necessary attributes
    .filter(({ attributes }) => attributes !== null);
  const elementsForTagging: AutoTaggedElement<Element>[] = [];

  const stegaNodes = findStegaNodes('body' in root ? root.body : root);

  for (const { node, text } of stegaNodes) {
    const sourceMap = decode(text);
    if (!sourceMap || !sourceMap.origin.includes('contentful.com')) {
      debug.warn(
        "Element has missing or invalid ContentSourceMap, please check if you have correctly enabled ContentSourceMaps and that the element's data originates from Contentful",
        {
          node,
          sourceMap,
        },
      );
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

    elementsForTagging.push({ element: node, sourceMap: sourceMap });
  }

  // Filter duplicate elements, so we don't tag them again and again
  const uniqElementsForTagging = elementsForTagging.filter(
    (el, index) => elementsForTagging.findIndex((et) => isSameElement(el, et)) === index,
  );

  for (const { element, sourceMap } of uniqElementsForTagging) {
    let inspectorModeAttributes: InspectorModeAttributes | null = null;

    if (sourceMap.href) {
      // Newer SDK versions will always have HREF, so we can use that to extract the attributes
      const attributes = parseAttributesFromHref(sourceMap.href);

      if (!attributes) {
        // parseAttributesFromHref already logs a warning
        continue;
      }

      if (attributes.entityType === 'Asset') {
        inspectorModeAttributes = {
          fieldId: attributes.fieldId,
          locale: attributes.locale,
          space: attributes.space,
          environment: attributes.environment,
          assetId: attributes.entityId,
        } as InspectorModeAssetAttributes;
      } else if (attributes.entityType === 'Entry') {
        inspectorModeAttributes = {
          fieldId: attributes.fieldId,
          locale: attributes.locale,
          space: attributes.space,
          environment: attributes.environment,
          entryId: attributes.entityId,
        } as InspectorModeEntryAttributes;
      } else {
        // This should not happen, but adding a warning just in case
        debug.warn('Unknown entityType', {
          element,
          sourceMap,
        });
        continue;
      }
    } else if (sourceMap.contentful && isLegacyContentfulData(sourceMap.contentful)) {
      // Older SDK versions might not have HREF (if platform was set to 'contentful'), so we need to extract the attributes from sourceMap.contentful
      const contentfulData = sourceMap.contentful;
      if (
        !contentfulData.entity ||
        !contentfulData.field ||
        !contentfulData.locale ||
        !contentfulData.space ||
        !contentfulData.environment
      ) {
        debug.warn(
          'Element has missing information in their ContentSourceMap, please check if you have restricted the platform for the encoding. (Missing parameters in `contentful`)',
          {
            element,
            sourceMap,
          },
        );
        continue;
      }

      const attributes: InspectorModeSharedAttributes = {
        fieldId: contentfulData.field,
        locale: contentfulData.locale,
        space: contentfulData.space,
        environment: contentfulData.environment,
      };

      if (contentfulData.entityType === 'Asset') {
        (attributes as InspectorModeAssetAttributes).assetId = contentfulData.entity;
        inspectorModeAttributes = attributes as InspectorModeAssetAttributes;
      } else if (contentfulData.entityType === 'Entry') {
        (attributes as InspectorModeEntryAttributes).entryId = contentfulData.entity;
        inspectorModeAttributes = attributes as InspectorModeEntryAttributes;
      } else {
        debug.warn('Unknown entityType in contentful data', {
          element,
          sourceMap,
        });
        continue;
      }
    } else {
      debug.warn(
        'Element has neither href nor contentful data in their ContentSourceMap, unable to extract attributes.',
        {
          element,
          sourceMap,
        },
      );
      continue;
    }

    taggedElements.push({
      element,
      attributes: inspectorModeAttributes,
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
        .taggedElements.map((element: PrecaulculatedTaggedElement) => {
          if (element.attributes && 'entryId' in element.attributes) {
            return element.attributes.entryId;
          }
          return null;
        })
        .filter(Boolean) as string[],
    ),
  ];
}

const isElementOverlapped = (element: Element, coordinates: DOMRect, root = window.document) => {
  const { top, right, bottom, left } = coordinates;
  const topLeft = root.elementFromPoint(left + 1, top + 1);
  const topRight = root.elementFromPoint(right - 1, top + 1);
  const bottomLeft = root.elementFromPoint(left + 1, bottom - 1);
  const bottomRight = root.elementFromPoint(right - 1, bottom - 1);

  return !(
    topLeft === element &&
    topRight === element &&
    bottomLeft === element &&
    bottomRight === element
  );
};

const addVisibilityToTaggedElements = (
  taggedElements: Partial<TaggedElement>[],
  root = window.document,
) =>
  taggedElements.map((taggedElement) => ({
    ...taggedElement,
    isVisible: taggedElement.element!.checkVisibility({
      checkOpacity: true,
      checkVisibilityCSS: true,
    }),
    isCoveredByOtherElement: isElementOverlapped(
      taggedElement.element!,
      taggedElement.coordinates!,
      root,
    ),
  }));

const addCoordinatesToTaggedElements = (
  taggedElements: Partial<TaggedElement>[],
): Partial<TaggedElement>[] =>
  taggedElements.map(({ element, attributes }) => ({
    element,
    coordinates: element!.getBoundingClientRect(),
    attributes,
  }));

/**
 * Applies the attributes that we cannot simply get from the tagged elements itself
 * but need to calculate based on the current state of the document
 */
export const addCalculatedAttributesToTaggedElements = (
  taggedElements: PrecaulculatedTaggedElement[],
  root = window.document,
): TaggedElement[] => {
  const taggedElementWithCoordinates = addCoordinatesToTaggedElements(taggedElements);
  return addVisibilityToTaggedElements(taggedElementWithCoordinates, root) as TaggedElement[];
};

/**
 * Parses a Contentful `href` URL to extract shared attributes, including the entity ID and entity type.
 *
 * @param {string} href - The URL containing Contentful parameters.
 * @returns {InspectorModeSharedAttributes | null} An object containing `entityId`, `entityType`, `fieldId`, `locale`, `space`, and `environment`, or `null` if parsing fails.
 *
 * The function extracts:
 * - `entityId` and `entityType` from the path segments (`entries/` or `assets/`).
 * - `fieldId` from the `focusedField` query parameter.
 * - `locale` from the `focusedLocale` query parameter.
 * - `space` from the path segment following `spaces/`.
 * - `environment` from the path segment following `environments/`.
 *
 * If any of these elements are missing or the URL is malformed, the function logs a warning and returns `null`.
 */
export function parseAttributesFromHref(href: string): {
  entityId: string;
  entityType: 'Entry' | 'Asset';
  fieldId: string;
  locale: string;
  space: string;
  environment: string;
} | null {
  try {
    const url = new URL(href);

    // Extract query parameters
    const fieldId = url.searchParams.get('focusedField');
    const locale = url.searchParams.get('focusedLocale');

    // Extract path segments
    const pathSegments = url.pathname.split('/').filter(Boolean);

    const spaceIndex = pathSegments.indexOf('spaces');
    const environmentIndex = pathSegments.indexOf('environments');

    const space = spaceIndex !== -1 ? pathSegments[spaceIndex + 1] : undefined;
    const environment = environmentIndex !== -1 ? pathSegments[environmentIndex + 1] : undefined;

    // Determine entityType and entityId
    let entityType: 'Entry' | 'Asset' | undefined;
    let entityId: string | undefined;

    const entriesIndex = pathSegments.indexOf('entries');
    const assetsIndex = pathSegments.indexOf('assets');

    if (entriesIndex !== -1) {
      entityType = 'Entry';
      entityId = pathSegments[entriesIndex + 1];
    } else if (assetsIndex !== -1) {
      entityType = 'Asset';
      entityId = pathSegments[assetsIndex + 1];
    }

    // Check for missing required attributes
    if (!entityType || !entityId) {
      console.warn('Unable to determine entityType or entityId from href', { href });
      return null;
    }

    if (!fieldId) {
      console.warn('Missing focusedField query parameter in href', { href });
      return null;
    }

    if (!locale) {
      console.warn('Missing focusedLocale query parameter in href', { href });
      return null;
    }

    if (!space || !environment) {
      console.warn('Missing space or environment in href path', { href });
      return null;
    }

    return {
      entityId,
      entityType,
      fieldId,
      locale,
      space,
      environment,
    };
  } catch (error) {
    console.warn('Invalid href URL', { href, error });
    return null;
  }
}

function isLegacyContentfulData(data: any): data is {
  entity: string;
  field: string;
  locale: string;
  space: string;
  environment: string;
  entityType: 'Asset' | 'Entry';
} {
  return (
    data &&
    typeof data.entity === 'string' &&
    typeof data.field === 'string' &&
    typeof data.locale === 'string' &&
    typeof data.space === 'string' &&
    typeof data.environment === 'string' &&
    (data.entityType === 'Asset' || data.entityType === 'Entry')
  );
}
