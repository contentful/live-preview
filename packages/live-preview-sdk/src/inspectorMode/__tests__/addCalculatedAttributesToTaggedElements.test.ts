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
    it('returns isCoveredByOtherElement as false if no element is covering tagged element', () => {
      const dom = html(`
        <div>
          <div
            id="entry-1"
          ${dataEntry}="entry-1"
          ${dataField}="field-1"
          ${dataLocale}="locale-1"
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

      const { taggedElements: elements } = getAllTaggedElements({
        root: dom,
        options: { locale: 'locale-1' },
      });

      const entry1 = dom.getElementById('entry-1');

      dom.elementFromPoint = (_x: number, _y: number) => {
        return entry1;
      };

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
          isCoveredByOtherElement: false,
          coordinates: entry1BoundingClientRect,
        },
      ]);
    });

    it('returns isCoveredByOtherElement as true if an element is covering tagged element', () => {
      const dom = html(`
        <div>
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

      const { taggedElements: elements } = getAllTaggedElements({
        root: dom,
        options: { locale: 'locale-1' },
      });

      const coveringElement = dom.getElementById('covering-element');

      dom.elementFromPoint = (_x: number, _y: number) => {
        return coveringElement;
      };

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
          coordinates: entry1BoundingClientRect,
        },
      ]);
    });
  });
});
