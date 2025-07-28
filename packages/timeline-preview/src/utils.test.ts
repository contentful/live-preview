import { describe, it, expect } from 'vitest';

import { buildTimelinePreviewToken, parseTimelinePreviewToken } from './utils.js';

describe('utils', () => {
  describe('buildTimelinePreviewToken', () => {
    it('should build a timeline preview token (with releaseId)', () => {
      const token = buildTimelinePreviewToken({ releaseId: '123' });
      expect(token).toBe('123;');
    });

    it('should build a timeline preview token (with timestamp)', () => {
      const token = buildTimelinePreviewToken({ timestamp: '2021-01-01' });
      expect(token).toBe(';2021-01-01');
    });

    it('should build a timeline preview token (with releaseId and timestamp)', () => {
      const token = buildTimelinePreviewToken({ releaseId: '123', timestamp: '2021-01-01' });
      expect(token).toBe('123;2021-01-01');
    });

    it('should throw an error if no releaseId or timestamp is provided', () => {
      expect(() => buildTimelinePreviewToken({})).toThrow(
        'Either releaseId or timestamp must be provided',
      );
    });
  });

  describe('parseTimelinePreviewToken', () => {
    it('should parse a timeline preview token (with releaseId)', () => {
      const token = '123;';
      const parsedToken = parseTimelinePreviewToken(token);
      expect(parsedToken).toEqual({ releaseId: '123', timestamp: undefined });
    });

    it('should parse a timeline preview token (with timestamp)', () => {
      const token = ';2021-01-01';
      const parsedToken = parseTimelinePreviewToken(token);
      expect(parsedToken).toEqual({ releaseId: undefined, timestamp: '2021-01-01' });
    });

    it('should parse a timeline preview token (with releaseId and timestamp)', () => {
      const token = '123;2021-01-01';
      const parsedToken = parseTimelinePreviewToken(token);
      expect(parsedToken).toEqual({ releaseId: '123', timestamp: '2021-01-01' });
    });
  });
});
