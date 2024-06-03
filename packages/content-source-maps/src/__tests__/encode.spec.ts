import { describe, expect, test } from 'vitest';

import { combine, decode } from '../encode.js';
import { SourceMapMetadata } from '../types.js';

describe('Stega Function Tests', () => {
  // Example metadata for testing
  const mockMetadata: SourceMapMetadata = {
    origin: 'example.com',
    href: 'https://example.com/page',
    contentful: {
      space: 'space-id',
      environment: 'master',
      entity: 'entity-id',
      entityType: 'Article',
      field: 'title',
      locale: 'en-US',
      editorInterface: {
        widgetNamespace: 'builtin',
        widgetId: 'singleLine',
      },
      fieldType: 'Symbol',
    },
  };

  describe('date formats', () => {
    test('encodes text ending with number', () => {
      const sampleText = 'Hello, world 2024';
      const combined = combine(sampleText, mockMetadata);
      const decoded = decode(combined);
      expect(decoded).toEqual(mockMetadata);
    });

    test('encodes dates with dot format', () => {
      const sampleText = '24.03.2024';
      const combined = combine(sampleText, mockMetadata);
      const decoded = decode(combined);
      expect(decoded).toEqual(mockMetadata);
    });

    test('encodes a subset of content', () => {
      const sampleText = 'something something something 24/3/2024';
      const combined = combine(sampleText, mockMetadata);
      const decoded = decode(combined);
      expect(decoded).toEqual(mockMetadata);
    });

    test('encodes dates in compact format', () => {
      const sampleText = '20241231';
      const combined = combine(sampleText, mockMetadata);
      const decoded = decode(combined);
      expect(decoded).toEqual(mockMetadata);
    });

    test('encodes dates in verbal format', () => {
      const sampleText = '31st December 2024';
      const combined = combine(sampleText, mockMetadata);
      const decoded = decode(combined);
      expect(decoded).toEqual(mockMetadata);
    });

    test('encodes dates with dash format', () => {
      const sampleText = '24-03-2024';
      const combined = combine(sampleText, mockMetadata);
      const decoded = decode(combined);
      expect(decoded).toEqual(mockMetadata);
    });

    test('encodes dates in ordinal (military) format', () => {
      const sampleText = '2024-365';
      const combined = combine(sampleText, mockMetadata);
      const decoded = decode(combined);
      expect(decoded).toEqual(mockMetadata);
    });

    test('skips encoding of ISO dates', () => {
      const sampleText = '2024-04-30T12:34:59Z';
      const combined = combine(sampleText, mockMetadata);
      const decoded = decode(combined);
      expect(decoded).toEqual(undefined);
    });

    test('skips encoding of dates with slash format', () => {
      const sampleText = '4/30/24';
      const combined = combine(sampleText, mockMetadata);
      const decoded = decode(combined);
      expect(decoded).toEqual(undefined);
    });
  });
});
