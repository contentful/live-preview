import { afterEach, describe, expect, it, vi } from 'vitest';

import { debug } from '../../helpers';
import { logUnrecognizedFields } from '../utils';

vi.mock('../../helpers');

describe('logUnrecognizedFields', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not log because all fields are known', () => {
    const fields = ['headline', 'content', 'top'];

    const data = {
      __typename: 'Demo',
      sys: { id: '1' },
      headline: 'abc',
      content: {
        __typename: 'Content',
        text: 'Hello World',
      },
      topCollection: [],
    };

    logUnrecognizedFields(fields, data);

    expect(debug.warn).not.toHaveBeenCalled();
  });

  it('should not log because all fields are known', () => {
    const fields = ['headline', 'content', 'top'];

    const data = {
      __typename: 'Demo',
      sys: { id: '1' },
      headline: 'abc',
      content: {
        __typename: 'Content',
        text: 'Hello World',
      },
      topCollection: [],
      unknown: 'ALERT',
    };

    logUnrecognizedFields(fields, data);

    expect(debug.warn).toHaveBeenCalledOnce();
    expect(debug.warn).toHaveBeenCalledWith(
      "Unrecognized field 'unknown'. Note that GraphQL aliases are not supported"
    );
  });
});
