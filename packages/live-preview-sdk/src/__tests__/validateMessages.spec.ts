import { describe, it, expect } from 'vitest';

import { LIVE_PREVIEW_EDITOR_SOURCE } from '../constants';
import { isValidMessage } from '../helpers/validateMessage';

describe('isValidMessage', () => {
  it('should return false because the event.data is missing', () => {
    expect(isValidMessage({} as unknown as MessageEvent)).toBeFalsy();
  });
  it('should return false because the event.data is not JSON', () => {
    expect(isValidMessage({ data: 'string' } as MessageEvent)).toBeFalsy();
  });
  it('should return false because the event.source is wrong', () => {
    expect(
      isValidMessage({ data: { any: 'data', source: 'webpack' } } as MessageEvent)
    ).toBeFalsy();
  });
  it('should return false because the event.from is wrong', () => {
    expect(isValidMessage({ data: { any: 'data', from: 'webpack' } } as MessageEvent)).toBeFalsy();
  });
  it('should return false because neither event.from and event.source is provided', () => {
    expect(isValidMessage({ data: { any: 'data' } } as MessageEvent)).toBeFalsy();
  });
  it('should return true because the event.source is valid', () => {
    expect(
      isValidMessage({ data: { any: 'data', source: LIVE_PREVIEW_EDITOR_SOURCE } } as MessageEvent)
    ).toBeTruthy();
  });
  it('should return true because the event.from is valid', () => {
    expect(
      isValidMessage({ data: { any: 'data', from: 'live-preview' } } as MessageEvent)
    ).toBeTruthy();
  });
});
