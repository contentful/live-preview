import { TagAttributes } from './types';

/**
 * Returns a list of tagged entries on the page
 */
export function getAllTaggedEntries(): string[] {
  return [
    ...new Set(
      [...document.querySelectorAll(`[${TagAttributes.ENTRY_ID}]`)]
        .map((element) => element.getAttribute(TagAttributes.ENTRY_ID))
        .filter(Boolean) as string[]
    ),
  ];
}
