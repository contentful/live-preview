import { describe, test, expect } from 'vitest';

import { clone, generateUID, setProtocolToHttps } from '../helpers';

describe('generateUID', () => {
  test('generates unique IDs', () => {
    const results = new Set();
    for (let i = 0; i < 1000; i++) {
      results.add(generateUID());
    }

    expect(results.size).toEqual(1000);
  });
});

describe('clone', () => {
  test("clones the original object, so it doesn't receives changes anymore", () => {
    const original = {
      title: 'Hello',
      nested: [{ subTitle: 'World' }],
    };
    const cloned = clone(original);

    expect(original).toEqual(cloned);

    cloned.title = 'Meow';
    cloned.nested[0].subTitle = 'says the cat';

    expect(original).not.toEqual(cloned);
    expect(original).toEqual({
      title: 'Hello',
      nested: [{ subTitle: 'World' }],
    });
  });
});

describe('setProtocolToHttps', () => {
  test.each`
    url                                                                                                                    | result
    ${'//images.ctfassets.net/c586i03gpxi9/bF3sZxYTHnAYJOFMNI3Vm/d32dd04a866df4511c701576022ac5fd/Polarlicht_2.jpg'}       | ${'https://images.ctfassets.net/c586i03gpxi9/bF3sZxYTHnAYJOFMNI3Vm/d32dd04a866df4511c701576022ac5fd/Polarlicht_2.jpg'}
    ${'https://images.ctfassets.net/c586i03gpxi9/bF3sZxYTHnAYJOFMNI3Vm/d32dd04a866df4511c701576022ac5fd/Polarlicht_2.jpg'} | ${'https://images.ctfassets.net/c586i03gpxi9/bF3sZxYTHnAYJOFMNI3Vm/d32dd04a866df4511c701576022ac5fd/Polarlicht_2.jpg'}
    ${'http://images.ctfassets.net/c586i03gpxi9/bF3sZxYTHnAYJOFMNI3Vm/d32dd04a866df4511c701576022ac5fd/Polarlicht_2.jpg'}  | ${'https://images.ctfassets.net/c586i03gpxi9/bF3sZxYTHnAYJOFMNI3Vm/d32dd04a866df4511c701576022ac5fd/Polarlicht_2.jpg'}
    ${'//custom-domain.com/c586i03gpxi9/bF3sZxYTHnAYJOFMNI3Vm/d32dd04a866df4511c701576022ac5fd/Polarlicht_2.jpg'}          | ${'https://custom-domain.com/c586i03gpxi9/bF3sZxYTHnAYJOFMNI3Vm/d32dd04a866df4511c701576022ac5fd/Polarlicht_2.jpg'}
  `('changes the protocal to https for $url', ({ url, result }) => {
    expect(setProtocolToHttps(url)).toEqual(result);
  });
});
