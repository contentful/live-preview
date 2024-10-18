import { combine } from '@contentful/content-source-maps';
import { describe, expect, it, vi } from 'vitest';

import { setDebugMode } from '../../helpers/debug.js';
import { InspectorModeDataAttributes, InspectorModeEntryAttributes } from '../types.js';
import { getAllTaggedElements } from '../utils.js';
import { createSourceMapFixture } from './fixtures/contentSourceMap.js';

describe('getAllTaggedElements', () => {
  const dataEntry = InspectorModeDataAttributes.ENTRY_ID;
  const dataAsset = InspectorModeDataAttributes.ASSET_ID;
  const dataField = InspectorModeDataAttributes.FIELD_ID;
  const dataLocale = InspectorModeDataAttributes.LOCALE;

  const html = (text: string) => {
    return new DOMParser().parseFromString(text, 'text/html');
  };

  describe('manual tagging', () => {
    it('should return all tagged elements', () => {
      const dom = html(`
		<div>
		  <!-- Entries -->
		  <div
		    id="entry-1"
			${dataEntry}="entry-1"
			${dataField}="field-1"></div>

		  <div
		    id="entry-2"
			${dataEntry}="entry-2"
			${dataField}="field-2"
			${dataLocale}="locale-2"></div>

		  <!-- Assets -->
		  <div
		    id="asset-1"
			${dataAsset}="asset-1"
			${dataField}="field-1"></div>

		  <div
		    id="asset-2"
			${dataAsset}="asset-2"
			${dataField}="field-2"
			${dataLocale}="locale-2"></div>
		</div>
	  `);

      const { taggedElements: elements } = getAllTaggedElements({
        root: dom,
        options: { locale: 'locale-1' },
      });

      expect(elements).toEqual([
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
        },
        {
          attributes: {
            entryId: 'entry-2',
            environment: undefined,
            fieldId: 'field-2',
            locale: 'locale-2',
            space: undefined,
            manuallyTagged: true,
          },
          element: dom.getElementById('entry-2'),
        },
        {
          attributes: {
            assetId: 'asset-1',
            environment: undefined,
            fieldId: 'field-1',
            locale: 'locale-1',
            space: undefined,
            manuallyTagged: true,
          },
          element: dom.getElementById('asset-1'),
        },
        {
          attributes: {
            assetId: 'asset-2',
            environment: undefined,
            fieldId: 'field-2',
            locale: 'locale-2',
            space: undefined,
            manuallyTagged: true,
          },
          element: dom.getElementById('asset-2'),
        },
      ]);
    });

    it('should ignore elements without field id', () => {
      const dom = html(`
		<div>
		  <!-- Keep -->
		  <div id="entry" ${dataEntry}="entry-id" ${dataField}="field-id"></div>

		  <!-- Ignore -->
		  <div ${dataEntry}="entry-1"></div>
		  <div ${dataEntry}="entry-2" ${dataLocale}="locale-2"></div>

		  <div ${dataAsset}="asset-1"></div>
		  <div ${dataAsset}="asset-2" ${dataLocale}="locale-2"></div>
		</div>
	  `);

      const { taggedElements: elements } = getAllTaggedElements({
        root: dom,
        options: { locale: 'locale-2' },
      });

      expect(elements).toEqual([
        {
          attributes: {
            entryId: 'entry-id',
            environment: undefined,
            fieldId: 'field-id',
            locale: 'locale-2',
            space: undefined,
            manuallyTagged: true,
          },
          element: dom.getElementById('entry'),
        },
      ]);
    });

    it('should ignore elements without entry or asset id', () => {
      const dom = html(`
		<div>
		  <!-- Keep -->
		  <div id="entry" ${dataEntry}="entry-id" ${dataField}="field-id"></div>
		  <!-- Ignore -->
		  <div ${dataField}="field-1"></div>

		  <div ${dataField}="field-2" ${dataLocale}="locale-2"></div>
		</div>
	  `);

      const { taggedElements: elements } = getAllTaggedElements({
        root: dom,
        options: { locale: 'locale-2' },
      });

      expect(elements).toEqual([
        {
          attributes: {
            entryId: 'entry-id',
            environment: undefined,
            fieldId: 'field-id',
            locale: 'locale-2',
            space: undefined,
            manuallyTagged: true,
          },
          element: dom.getElementById('entry'),
        },
      ]);
    });
  });

  describe('Auto-tagging', () => {
    const metadata = createSourceMapFixture('test-entry-id');

    it('should ignore encoded data if origin does not match', () => {
      const dom = html(
        `<span>${combine('Test', createSourceMapFixture('ignore_origin', { origin: 'example.com' }))}</span>`,
      );

      setDebugMode(true);
      vi.spyOn(console, 'warn');

      const { taggedElements: elements } = getAllTaggedElements({
        root: dom,
        options: { locale: 'en-US' },
      });
      expect(elements).toEqual([]);
      expect(console.warn).toHaveBeenCalled();
    });

    it('should recognize auto-tagged elements', () => {
      const dom = html(`<span id="entry-1">${combine('Test', metadata)}</span>`);

      const { taggedElements: elements } = getAllTaggedElements({
        root: dom,
        options: { locale: 'en-US' },
      });

      expect(elements).toHaveLength(1);
      expect(elements).toEqual([
        {
          attributes: {
            entryId: 'test-entry-id',
            environment: 'master',
            fieldId: 'title',
            locale: 'en-US',
            space: 'master',
          },
          element: dom.getElementById('entry-1'),
        },
      ]);
    });

    describe('grouping information', () => {
      it('should not tag nested elements with the same information', () => {
        const dom = html(`
          <p id="node-1">${combine('Hello', metadata)}<strong>${combine('World', metadata)}</strong>!</p>
      `);

        const { taggedElements: elements } = getAllTaggedElements({
          root: dom,
          options: { locale: 'en-US' },
        });

        expect(elements).toHaveLength(1);
        expect(elements).toEqual([
          {
            attributes: {
              entryId: 'test-entry-id',
              environment: 'master',
              fieldId: 'title',
              locale: 'en-US',
              space: 'master',
            },
            element: dom.getElementById('node-1'),
          },
        ]);
      });

      it('should tag elements with different information separately', () => {
        const referenceMetadata = createSourceMapFixture('reference');
        const globeMetadata = createSourceMapFixture('globe', {
          entityType: 'Asset',
        });

        const dom = html(`
        <div id="richtext">
          <p id="node-1">${combine('Hello', metadata)}</p>
          <p id="node-2">${combine('World', metadata)}</p>
          <span id="node-3">
            <div id="reference">${combine('Hallo Welt from germany', referenceMetadata)}</div>
          </span>
          <span id="node-4">
            <img id="globe" src="./imgp.jpg" alt="${combine('globe', globeMetadata)}" />
          </span>
        </div>
      `);

        const { taggedElements: elements } = getAllTaggedElements({
          root: dom,
          options: { locale: 'en-US' },
        });

        expect(elements).toHaveLength(4);
        expect(elements).toEqual([
          {
            attributes: {
              entryId: 'test-entry-id',
              environment: 'master',
              fieldId: 'title',
              locale: 'en-US',
              space: 'master',
            },
            element: dom.getElementById('node-1'),
          },
          {
            attributes: {
              entryId: 'test-entry-id',
              environment: 'master',
              fieldId: 'title',
              locale: 'en-US',
              space: 'master',
            },
            element: dom.getElementById('node-2'),
          },
          {
            attributes: {
              entryId: 'reference',
              environment: 'master',
              fieldId: 'title',
              locale: 'en-US',
              space: 'master',
            },
            element: dom.getElementById('reference'),
          },
          {
            attributes: {
              assetId: 'globe',
              environment: 'master',
              fieldId: 'title',
              locale: 'en-US',
              space: 'master',
            },
            element: dom.getElementById('globe'),
          },
        ]);
      });
    });

    it('should tag the images correctly by prefering the wrapping picture or figure', () => {
      const img1 = createSourceMapFixture('img1', { entityType: 'Asset' });
      const img2 = createSourceMapFixture('img2', { entityType: 'Asset' });
      const img3 = createSourceMapFixture('img3', { entityType: 'Asset' });

      const dom = html(`
        <div>
          <figure id="img1">
            <img src="/elephant.jpg" alt="${combine('Elephant at sunset', img1)}" />
            <figcaption>${combine('An elephant at sunset', img1)}</figcaption>
          </figure>
          <picture id="img2">
            <source srcset="/lion-potrait.jpg" media="(orientation: portrait)" />
            <img src="/lion-298-332.jpg" alt="${combine('A lion staring at the sun', img2)}" />
          </picture>
          <img id="img3" src="./monkey.jpg" alt="${combine('A monkey throwing a cocosnut at a lion', img3)}" />
        </div>
      `);

      const { taggedElements: elements } = getAllTaggedElements({
        root: dom,
        options: { locale: 'en-US' },
      });

      expect(elements).toHaveLength(3);
      expect(elements).toEqual([
        {
          attributes: {
            assetId: 'img1',
            environment: 'master',
            fieldId: 'title',
            locale: 'en-US',
            space: 'master',
          },
          element: dom.getElementById('img1'),
        },
        {
          attributes: {
            assetId: 'img2',
            environment: 'master',
            fieldId: 'title',
            locale: 'en-US',
            space: 'master',
          },
          element: dom.getElementById('img2'),
        },
        {
          attributes: {
            assetId: 'img3',
            environment: 'master',
            fieldId: 'title',
            locale: 'en-US',
            space: 'master',
          },
          element: dom.getElementById('img3'),
        },
      ]);
    });

    it('does not override elements that are manually tagged', () => {
      const dom = html(`<div>
	    <div id="entry" ${dataEntry}="manual-entry-id" ${dataField}="manual-field-id">
		  ${combine('Hello', metadata)}
		</div>
	  </div>`);

      const { taggedElements: elements } = getAllTaggedElements({
        root: dom,
        options: { locale: 'locale-2' },
      });

      expect(elements.length).toEqual(1);
      expect((elements[0].attributes as InspectorModeEntryAttributes).entryId).toEqual(
        'manual-entry-id',
      );
      expect(elements[0].attributes?.fieldId).toEqual('manual-field-id');
      expect(elements[0].attributes?.locale).toEqual('locale-2');
    });

    it('ignore manually tagged elements if requested', () => {
      const dom = html(`<div>
	    <div id="entry" ${dataEntry}="manual-entry-id" ${dataField}="manual-field-id">
		  ${combine('Test', metadata)}
		</div>
	  </div>`);

      const {
        taggedElements: elements,
        autoTaggedElements,
        manuallyTaggedCount,
      } = getAllTaggedElements({
        root: dom,
        options: { locale: 'en-US', ignoreManuallyTaggedElements: true },
      });

      expect(elements.length).toEqual(1);
      expect(autoTaggedElements.length).toEqual(1);
      expect(manuallyTaggedCount).toEqual(0);
    });
  });
});
