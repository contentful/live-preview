import { describe, expect, it } from 'vitest';

import { LIVE_PREVIEW_EDITOR_SOURCE } from '../constants.js';
import { isValidMessage } from '../helpers/validateMessage.js';

describe('isValidMessage', () => {
  it('should return false because the event.data is missing', () => {
    expect(isValidMessage({} as unknown as MessageEvent)).toBeFalsy();
  });
  it('should return false because the event.data is not JSON', () => {
    expect(isValidMessage({ data: 'string' } as MessageEvent)).toBeFalsy();
  });
  it('should return false because the event.source is wrong', () => {
    expect(
      isValidMessage({ data: { any: 'data', source: 'webpack' } } as MessageEvent),
    ).toBeFalsy();
  });
  it('should return false because event.source is not provided', () => {
    expect(isValidMessage({ data: { any: 'data' } } as MessageEvent)).toBeFalsy();
  });
  it('should return true because the event.source is valid', () => {
    expect(
      isValidMessage({ data: { any: 'data', source: LIVE_PREVIEW_EDITOR_SOURCE } } as MessageEvent),
    ).toBeTruthy();
  });
});
