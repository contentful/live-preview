import { describe, expect, it } from 'vitest';

import { InspectorModeDataAttributes } from '../types.js';
import { addCalculatedAttributesToTaggedElements, getAllTaggedElements } from '../utils.js';

describe('addCalculatedAttributesToTaggedElements', () => {
  const dataEntry = InspectorModeDataAttributes.ENTRY_ID;
  const dataField = InspectorModeDataAttributes.FIELD_ID;
  const dataLocale = InspectorModeDataAttributes.LOCALE;

  const html = (text: string) => {
    return new DOMParser().parseFromString(text, 'text/html');
  };

  describe('visibility attributes', () => {
    it('should return if tagged element is covered by another one of a higher z-index', () => {
      const dom = html(`
        <div>
          <!-- Entries -->
          <div
            id="entry-1"
          ${dataEntry}="entry-1"
          ${dataField}="field-1"
          ${dataLocale}="locale-1"
          ></div>
          <div
            id="covering-element"
            style="position: absolute; z-index: 100; top: 0; left: 0; width: 100%; height: 100%;"
          ></div>
        </div>
        `);

      dom.getElementById('entry-1')!.checkVisibility = () => true;
      const entry1Coordinates = {
        bottom: 100,
        height: 100,
        left: 10,
        right: 100,
        top: 10,
        width: 100,
        x: 10,
        y: 10,
      };
      const entry1BoundingClientRect = {
        ...entry1Coordinates,
        toJSON: () => entry1Coordinates,
      };
      dom.getElementById('entry-1')!.getBoundingClientRect = () => entry1BoundingClientRect;

      // covering element
      dom.getElementById('covering-element')!.checkVisibility = () => true;
      const coveringElementCoordinates = {
        bottom: 200,
        height: 200,
        left: 0,
        right: 200,
        top: 0,
        width: 200,
        x: 0,
        y: 0,
      };
      const coveringElementBoundingClientRect = {
        ...coveringElementCoordinates,
        toJSON: () => coveringElementCoordinates,
      };
      dom.getElementById('covering-element')!.getBoundingClientRect = () =>
        coveringElementBoundingClientRect;

      const { taggedElements: elements } = getAllTaggedElements({
        root: dom,
        options: { locale: 'locale-1' },
      });
      const elementsWithCalculatedAttributes = addCalculatedAttributesToTaggedElements(
        elements,
        dom,
      );
      expect(elementsWithCalculatedAttributes).toEqual([
        {
          attributes: {
            entryId: 'entry-1',
            environment: undefined,
            fieldId: 'field-1',
            locale: 'locale-1',
            space: undefined,
            manuallyTagged: true,
          },
          element: dom.getElementById('entry-1'),
          isVisible: true,
          isCoveredByOtherElement: true,
          zIndex: 0,
          coordinates: entry1BoundingClientRect,
          layerCoordinates: entry1BoundingClientRect,
        },
      ]);
    });
  });
});
