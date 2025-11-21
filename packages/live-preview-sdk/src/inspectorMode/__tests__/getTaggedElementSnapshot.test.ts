import { describe, expect, it } from 'vitest';

import { TaggedElement } from '../utils.js';
import { getTaggedElementSnapshot } from '../utils.js';

describe('getTaggedElementSnapshot', () => {
  const html = (text: string) => {
    return new DOMParser().parseFromString(text, 'text/html');
  };

  const createTaggedElement = (element: Element): TaggedElement => {
    return {
      element,
      attributes: {
        entryId: 'test-entry',
        fieldId: 'test-field',
        locale: 'en-US',
        space: 'test-space',
        environment: 'master',
      },
      isHovered: false,
      isVisible: true,
      coordinates: element.getBoundingClientRect(),
      isCoveredByOtherElement: false,
    };
  };

  describe('void HTML elements', () => {
    it('should return attributes for IMG element', () => {
      const dom = html('<img id="test" src="/image.jpg" alt="Test image" width="100" />');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        img: 'id="test" src="/image.jpg" alt="Test image" width="100"',
      });
    });

    it('should return attributes for INPUT element', () => {
      const dom = html('<input id="test" type="text" name="username" value="John" />');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        input: 'id="test" type="text" name="username" value="John"',
      });
    });

    it('should return attributes for BR element', () => {
      const dom = html('<br id="test" class="line-break" />');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        br: 'id="test" class="line-break"',
      });
    });

    it('should return attributes for HR element', () => {
      const dom = html('<hr id="test" class="divider" />');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        hr: 'id="test" class="divider"',
      });
    });

    it('should return attributes for AREA element', () => {
      const dom = html(
        '<area id="test" shape="rect" coords="0,0,82,126" href="link.html" alt="Area" />',
      );
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        area: 'id="test" shape="rect" coords="0,0,82,126" href="link.html" alt="Area"',
      });
    });

    it('should return attributes for BASE element', () => {
      const dom = html('<base id="test" href="https://example.com/" target="_blank" />');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        base: 'id="test" href="https://example.com/" target="_blank"',
      });
    });

    it('should return attributes for COL element', () => {
      const dom = html(
        '<table><colgroup><col id="test" span="2" class="column" /></colgroup></table>',
      );
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        col: 'id="test" span="2" class="column"',
      });
    });

    it('should return attributes for EMBED element', () => {
      const dom = html('<embed id="test" src="video.mp4" type="video/mp4" />');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        embed: 'id="test" src="video.mp4" type="video/mp4"',
      });
    });

    it('should return attributes for LINK element', () => {
      const dom = html('<link id="test" rel="stylesheet" href="styles.css" />');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        link: 'id="test" rel="stylesheet" href="styles.css"',
      });
    });

    it('should return attributes for META element', () => {
      const dom = html('<meta id="test" name="description" content="Test description" />');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        meta: 'id="test" name="description" content="Test description"',
      });
    });

    it('should return attributes for PARAM element', () => {
      const dom = html('<param id="test" name="autoplay" value="true" />');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        param: 'id="test" name="autoplay" value="true"',
      });
    });

    it('should return attributes for SOURCE element', () => {
      const dom = html('<source id="test" src="audio.mp3" type="audio/mpeg" />');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        source: 'id="test" src="audio.mp3" type="audio/mpeg"',
      });
    });

    it('should return attributes for TRACK element', () => {
      const dom = html('<track id="test" src="captions.vtt" kind="captions" srclang="en" />');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        track: 'id="test" src="captions.vtt" kind="captions" srclang="en"',
      });
    });

    it('should return attributes for WBR element', () => {
      const dom = html('<wbr id="test" class="word-break" />');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        wbr: 'id="test" class="word-break"',
      });
    });

    it('should handle void elements with no attributes', () => {
      const dom = html('<br />');
      const element = dom.querySelector('br')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        br: '',
      });
    });

    it('should handle void elements with data attributes', () => {
      const dom = html(
        '<img id="test" src="/image.jpg" data-custom="value" data-contentful-field-id="image" />',
      );
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot.img).toContain('id="test"');
      expect(snapshot.img).toContain('src="/image.jpg"');
      expect(snapshot.img).toContain('data-custom="value"');
      expect(snapshot.img).toContain('data-contentful-field-id="image"');
    });
  });

  describe('non-void HTML elements', () => {
    it('should return innerHTML for DIV element', () => {
      const dom = html('<div id="test"><p>Hello World</p></div>');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        div: '<p>Hello World</p>',
      });
    });

    it('should return innerHTML for SPAN element', () => {
      const dom = html('<span id="test">Simple text</span>');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        span: 'Simple text',
      });
    });

    it('should return innerHTML for P element', () => {
      const dom = html('<p id="test">This is a <strong>paragraph</strong> with formatting.</p>');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        p: 'This is a <strong>paragraph</strong> with formatting.',
      });
    });

    it('should return innerHTML for H1 element', () => {
      const dom = html('<h1 id="test">Main Heading</h1>');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        h1: 'Main Heading',
      });
    });

    it('should return innerHTML for UL element with nested content', () => {
      const dom = html('<ul id="test"><li>Item 1</li><li>Item 2</li></ul>');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        ul: '<li>Item 1</li><li>Item 2</li>',
      });
    });

    it('should return innerHTML for TABLE element', () => {
      const dom = html('<table id="test"><tr><td>Cell 1</td><td>Cell 2</td></tr></table>');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        table: '<tbody><tr><td>Cell 1</td><td>Cell 2</td></tr></tbody>',
      });
    });

    it('should return innerHTML for ARTICLE element', () => {
      const dom = html('<article id="test"><h2>Article Title</h2><p>Content</p></article>');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        article: '<h2>Article Title</h2><p>Content</p>',
      });
    });

    it('should return innerHTML for SECTION element', () => {
      const dom = html('<section id="test"><div>Section content</div></section>');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        section: '<div>Section content</div>',
      });
    });

    it('should return innerHTML for empty element', () => {
      const dom = html('<div id="test"></div>');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        div: '',
      });
    });

    it('should return innerHTML for element with only text', () => {
      const dom = html('<p id="test">Plain text content</p>');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        p: 'Plain text content',
      });
    });

    it('should return innerHTML for deeply nested content', () => {
      const dom = html('<div id="test"><div><div><span>Deeply nested</span></div></div></div>');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        div: '<div><div><span>Deeply nested</span></div></div>',
      });
    });

    it('should handle element with special characters in innerHTML', () => {
      const dom = html('<div id="test">&lt;script&gt;alert("XSS")&lt;/script&gt;</div>');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        div: '&lt;script&gt;alert("XSS")&lt;/script&gt;',
      });
    });

    it('should handle element with mixed content including void elements', () => {
      const dom = html('<div id="test">Text <img src="img.jpg" alt="Image"> more text</div>');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot.div).toContain('Text ');
      expect(snapshot.div).toContain('<img');
      expect(snapshot.div).toContain('more text');
    });
  });

  describe('tag name casing', () => {
    it('should return lowercase tag name for uppercase tag', () => {
      const dom = html('<DIV id="test">Content</DIV>');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toHaveProperty('div');
      expect(snapshot).not.toHaveProperty('DIV');
    });

    it('should return lowercase tag name for void element', () => {
      const dom = html('<IMG id="test" src="/image.jpg" alt="Test" />');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toHaveProperty('img');
      expect(snapshot).not.toHaveProperty('IMG');
    });
  });

  describe('edge cases', () => {
    it('should handle PICTURE element (non-void)', () => {
      const dom = html(
        '<picture id="test"><source srcset="image.webp" type="image/webp"><img src="image.jpg" alt="Fallback"></picture>',
      );
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toHaveProperty('picture');
      expect(snapshot.picture).toContain('<source');
      expect(snapshot.picture).toContain('<img');
    });

    it('should handle FIGURE element (non-void)', () => {
      const dom = html(
        '<figure id="test"><img src="image.jpg" alt="Image"><figcaption>Caption</figcaption></figure>',
      );
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toHaveProperty('figure');
      expect(snapshot.figure).toContain('<img');
      expect(snapshot.figure).toContain('<figcaption>Caption</figcaption>');
    });

    it('should handle VIDEO element (non-void)', () => {
      const dom = html(
        '<video id="test" controls><source src="video.mp4" type="video/mp4"></video>',
      );
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toHaveProperty('video');
      expect(snapshot.video).toContain('<source');
    });

    it('should handle AUDIO element (non-void)', () => {
      const dom = html(
        '<audio id="test" controls><source src="audio.mp3" type="audio/mpeg"></audio>',
      );
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toHaveProperty('audio');
      expect(snapshot.audio).toContain('<source');
    });

    it('should handle BUTTON element (non-void)', () => {
      const dom = html('<button id="test" type="button">Click me</button>');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        button: 'Click me',
      });
    });

    it('should handle TEXTAREA element (non-void)', () => {
      const dom = html('<textarea id="test">Default text</textarea>');
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toEqual({
        textarea: 'Default text',
      });
    });

    it('should handle SELECT element (non-void)', () => {
      const dom = html(
        '<select id="test"><option value="1">Option 1</option><option value="2">Option 2</option></select>',
      );
      const element = dom.getElementById('test')!;
      const taggedElement = createTaggedElement(element);

      const snapshot = getTaggedElementSnapshot(taggedElement);

      expect(snapshot).toHaveProperty('select');
      expect(snapshot.select).toContain('<option');
    });
  });
});
