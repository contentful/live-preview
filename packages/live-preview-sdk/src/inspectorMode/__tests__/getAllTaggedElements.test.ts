import { describe, it, expect } from 'vitest';
import { getAllTaggedElements } from '../utils';
import { InspectorModeDataAttributes } from '../types';

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

      const elements = getAllTaggedElements(dom);

      expect(elements).toEqual([
        dom.getElementById('entry-1'),
        dom.getElementById('entry-2'),
        dom.getElementById('asset-1'),
        dom.getElementById('asset-2'),
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

      const elements = getAllTaggedElements(dom);

      expect(elements).toEqual([dom.getElementById('entry')]);
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

      const elements = getAllTaggedElements(dom);

      expect(elements).toEqual([dom.getElementById('entry')]);
    });
  });
});
