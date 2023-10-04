import { TagAttributes } from './types';

/**
 * Parses the necessary information from the element and returns them.
 * If **one** of the information is missing it returns null
 */
export function getTaggedInformation(
  element: Element,
  fallbackLocale?: string
): { fieldId: string; entryId: string; locale: string } | null {
  const fieldId = element.getAttribute(TagAttributes.FIELD_ID);
  const entryId = element.getAttribute(TagAttributes.ENTRY_ID);
  const locale = element.getAttribute(TagAttributes.LOCALE) ?? fallbackLocale;

  if (!fieldId || !entryId || !locale) {
    return null;
  }

  return { fieldId, entryId, locale };
}

/**
 * Query the document for all tagged elements
 * **Attention:** Can include elements that have not all attributes,
 * if you want to have only valid ones check for `getTaggedInformation`
 */
export function getAllTaggedElements(): Element[] {
  return [...document.querySelectorAll(`[${TagAttributes.ENTRY_ID}]`)];
}

/**
 * Returns a list of tagged entries on the page
 */
export function getAllTaggedEntries(): string[] {
  return [
    ...new Set(
      getAllTaggedElements()
        .map((element) => element.getAttribute(TagAttributes.ENTRY_ID))
        .filter(Boolean) as string[]
    ),
  ];
}
