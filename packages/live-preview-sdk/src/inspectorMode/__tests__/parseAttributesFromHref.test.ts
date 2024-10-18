import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseAttributesFromHref } from '../utils.js';

describe('parseAttributesFromHref', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should extract all attributes from a valid Entry href', () => {
    const href =
      'https://app.contentful.com/spaces/foo/environments/master/entries/a1b2c3/?focusedField=title&focusedLocale=en-US&source=vercel-content-link';
    const attributes = parseAttributesFromHref(href);
    expect(attributes).toEqual({
      entityId: 'a1b2c3',
      entityType: 'Entry',
      fieldId: 'title',
      locale: 'en-US',
      space: 'foo',
      environment: 'master',
    });
  });

  it('should extract all attributes from a valid Asset href', () => {
    const href =
      'https://app.contentful.com/spaces/foo/environments/master/assets/d4e5f6/?focusedField=file&focusedLocale=en-US&source=vercel-content-link';
    const attributes = parseAttributesFromHref(href);
    expect(attributes).toEqual({
      entityId: 'd4e5f6',
      entityType: 'Asset',
      fieldId: 'file',
      locale: 'en-US',
      space: 'foo',
      environment: 'master',
    });
  });

  it('should return null and warn if focusedField is missing', () => {
    const href =
      'https://app.contentful.com/spaces/foo/environments/master/entries/a1b2c3/?focusedLocale=en-US&source=vercel-content-link';
    const attributes = parseAttributesFromHref(href);
    expect(attributes).toBeNull();
    expect(console.warn).toHaveBeenCalledWith('Missing focusedField query parameter in href', {
      href,
    });
  });

  it('should return null and warn if focusedLocale is missing', () => {
    const href =
      'https://app.contentful.com/spaces/foo/environments/master/assets/d4e5f6/?focusedField=file&source=vercel-content-link';
    const attributes = parseAttributesFromHref(href);
    expect(attributes).toBeNull();
    expect(console.warn).toHaveBeenCalledWith('Missing focusedLocale query parameter in href', {
      href,
    });
  });

  it('should return null and warn if query parameters are missing', () => {
    const href = 'https://app.contentful.com/spaces/foo/environments/master/entries/a1b2c3/';
    const attributes = parseAttributesFromHref(href);
    expect(attributes).toBeNull();
    expect(console.warn).toHaveBeenCalledWith('Missing focusedField query parameter in href', {
      href,
    });
  });

  it('should return null and warn if spaces or environments are missing', () => {
    const href = 'https://app.contentful.com/assets/d4e5f6/?focusedField=file&focusedLocale=en-US';
    const attributes = parseAttributesFromHref(href);
    expect(attributes).toBeNull();
    expect(console.warn).toHaveBeenCalledWith('Missing space or environment in href path', {
      href,
    });
  });

  it('should return null and warn if URL is malformed', () => {
    const href = 'not a url';
    const attributes = parseAttributesFromHref(href);
    expect(attributes).toBeNull();
    expect(console.warn).toHaveBeenCalledWith('Invalid href URL', {
      href,
      error: expect.any(Error),
    });
  });

  it('should return null and warn if href is empty', () => {
    const href = '';
    const attributes = parseAttributesFromHref(href);
    expect(attributes).toBeNull();
    expect(console.warn).toHaveBeenCalledWith('Invalid href URL', {
      href,
      error: expect.any(Error),
    });
  });

  it('should return null and warn if entity segment is missing', () => {
    const href =
      'https://app.contentful.com/spaces/foo/environments/master/?focusedField=title&focusedLocale=en-US';
    const attributes = parseAttributesFromHref(href);
    expect(attributes).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      'Unable to determine entityType or entityId from href',
      { href },
    );
  });
});
