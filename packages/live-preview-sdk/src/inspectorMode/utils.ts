import { InspectorModeAttributes, InspectorModeDataAttributes } from './types';

/**
 * Parses the necessary information from the element and returns them.
 * If **one** of the information is missing it returns null
 */
export function getInspectorModeAttributes(
  element: Element,
  fallbackLocale?: string
): InspectorModeAttributes | null {
  const fieldId = element.getAttribute(InspectorModeDataAttributes.FIELD_ID);
  const entryId = element.getAttribute(InspectorModeDataAttributes.ENTRY_ID);
  const assetId = element.getAttribute(InspectorModeDataAttributes.ASSET_ID);
  const locale = element.getAttribute(InspectorModeDataAttributes.LOCALE) ?? fallbackLocale;

  if (assetId && locale && fieldId) {
    return { fieldId, assetId, locale };
  }

  if (entryId && locale && fieldId) {
    return { fieldId, entryId, locale };
  }

  return null;
}

/**
 * Query the document for all tagged elements
 * **Attention:** Can include elements that have not all attributes,
 * if you want to have only valid ones check for `getTaggedInformation`
 */
export function getAllTaggedElements(): Element[] {
  const allElements = [
    ...document.querySelectorAll(`[${InspectorModeDataAttributes.ENTRY_ID}]`),
    ...document.querySelectorAll(`[${InspectorModeDataAttributes.ASSET_ID}]`),
  ];
  return allElements;
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
