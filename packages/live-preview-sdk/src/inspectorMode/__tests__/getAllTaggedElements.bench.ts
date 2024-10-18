import { combine } from '@contentful/content-source-maps';
import { describe, expect, bench } from 'vitest';

import { getAllTaggedElements } from '../utils.js';
import { createSourceMapFixture } from './fixtures/contentSourceMap.js';

describe('getAllTaggedElements', () => {
  const html = (text: string) => {
    return new DOMParser().parseFromString(text, 'text/html');
  };

  bench('should work performant on larger pages', () => {
    const dom = html(`
        <div id="root">
          <div id="parent_tagged">
            ${new Array(10)
              .fill('x')
              .map((_, index) => {
                const sourceMap = createSourceMapFixture('parent_tagged');
                const content = combine(
                  `Parent should be tagged even if this is the "${index}" element.`,
                  sourceMap,
                );
                return `<p>${content}</p>`;
              })
              .join('')}
          </div>
          <div id="flat_list">
            ${new Array(10)
              .fill('x')
              .map((_, index) => {
                const sourceMap = createSourceMapFixture(`flat_item-${index}`);
                const content = combine(
                  `Every item in the flat list should be tagged. This is the ${index} element.`,
                  sourceMap,
                );
                return `<p>${content}</p>`;
              })
              .join('')}
          </div>
          <div id="richtext">
            ${new Array(30)
              .fill('x')
              .map((_, index) => {
                const sourceMap = createSourceMapFixture(`rte-nested-${index}`);
                const inlineItems = new Array(10).fill('x').map((_, nestedIndex) => {
                  const tag = nestedIndex % 2 === 0 ? 'strong' : 'b';
                  const content = combine(
                    `Richtext nested content with tag ${tag} ${index} ${nestedIndex}`,
                    sourceMap,
                  );
                  return `<${tag}>${content}</${tag}>`;
                });

                const inlineContent = inlineItems.join(' ');

                return `<p id="richtext-paragraph-${index}">${inlineContent}</p>`;
              })
              .join('\n')}
          </div>
          <div id="img">
            <img
              src="./picture.jpg"
              alt="${combine('Some alt text for the picture', createSourceMapFixture('img-1', { entityType: 'Asset' }))}"
            />
          </div>
          <div id="picture">
            <picture>
              <source srcset="/lion-potrait.jpg" media="(orientation: portrait)" />
              <img
                src="/lion-298-332.jpg"
                alt="${combine('A lion staring at the sun', createSourceMapFixture('img-2', { entityType: 'Asset' }))}"
              />
            </picture>
          </div>
          <div id="figure">
            <figure>
              <span>
                <span>
                  <img
                    src="/elephant.jpg"
                    alt="${combine('Elephant at sunset', createSourceMapFixture('img-3', { entityType: 'Asset' }))})}"
                  />
                </span>
              </span>
              <figcaption>${combine('An elephant at sunset', createSourceMapFixture('img-3', { entityType: 'Asset' }))})}</figcaption>
            </figure>
          </div>
        </div>
      `);

    const elements = getAllTaggedElements({
      root: dom,
      options: { locale: 'en-US', ignoreManuallyTaggedElements: true },
    });

    expect(elements).toHaveLength(1 + 10 + 30 + 3);
  });
});
