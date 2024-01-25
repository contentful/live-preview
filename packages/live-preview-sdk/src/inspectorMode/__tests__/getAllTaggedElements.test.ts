import { describe, it, expect } from 'vitest';

import { SourceMapMetadata, encode } from '../../csm/encode';
import { InspectorModeDataAttributes } from '../types';
import { getAllTaggedElements } from '../utils';

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

  describe('Auto-tagging', () => {
    const metadata: SourceMapMetadata = {
      href: 'contentful.com/test',
      origin: 'contentful.com',
      contentful: {
        space: 'test',
        environment: 'master',
        entity: 'entry-id',
        entityType: 'Entry',
        field: 'title',
        locale: 'en-US',
      },
    };

    it('should ignore encoded data if origin does not match', () => {
      const dom = html(`
		<span>${
      'Test' +
      encode({
        ...metadata,
        origin: 'example.com',
      })
    }</span>`);

      const elements = getAllTaggedElements(dom);
      expect(elements).toEqual([]);
    });

    it('should recognize auto-tagged elements', () => {
      const dom = html(`<span id="entry-1">${'Test' + encode(metadata)}</span>`);

      const elements = getAllTaggedElements(dom);
      expect(elements).toEqual([dom.getElementById('entry-1')]);
    });

    it('does not override elements that are manually tagged', () => {
      const dom = html(`<div>
	    <div id="entry" ${dataEntry}="manual-entry-id" ${dataField}="manual-field-id">
		  ${'Hello' + encode(metadata)}
		</div>
	  </div>`);

      const elements = getAllTaggedElements(dom);

      expect(elements.length).toEqual(1);
      expect(elements[0].getAttribute(InspectorModeDataAttributes.ENTRY_ID)).toEqual(
        'manual-entry-id'
      );
      expect(elements[0].getAttribute(InspectorModeDataAttributes.FIELD_ID)).toEqual(
        'manual-field-id'
      );
      expect(elements[0].getAttribute(InspectorModeDataAttributes.LOCALE)).toEqual(null);
    });

    it('ignore manually tagged elements if requested', () => {
      const dom = html(`<div>
	    <div id="entry" ${dataEntry}="manual-entry-id" ${dataField}="manual-field-id">
		  ${'Test' + encode(metadata)}
		</div>
	  </div>`);

      const elements = getAllTaggedElements(dom, true);

      expect(elements.length).toEqual(1);
      expect(elements[0].getAttribute(InspectorModeDataAttributes.ENTRY_ID)).toEqual('entry-id');
      expect(elements[0].getAttribute(InspectorModeDataAttributes.FIELD_ID)).toEqual('title');
      expect(elements[0].getAttribute(InspectorModeDataAttributes.LOCALE)).toEqual('en-US');
    });
  });
});
