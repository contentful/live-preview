import { gql } from 'graphql-tag';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { debug } from '../helpers/index.js';
import { validateLiveUpdatesConfiguration } from '../helpers/validation.js';
import * as items from './fixtures/items.json';

vi.mock('../helpers/debug');

describe('validateLiveUpdatesConfiguration', () => {
  const callback = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('config.data', () => {
    it('stops at 10 level depth to prevents infinite loops', () => {
      const data1 = { value: { data: {} } };
      const data2 = { value: { data: {} } };

      data1.value.data = data2;
      data2.value.data = data1;

      const config = {
        callback,
        data: {
          value: data1,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      };

      const result = validateLiveUpdatesConfiguration(config);

      expect(debug.error).toHaveBeenCalledTimes(2);
      expect(debug.error).toHaveBeenCalledWith(
        'Max depth for validation of subscription data is reached, please provide your data in the correct format.',
      );
      expect(debug.error).toHaveBeenCalledWith(
        'Live Updates requires the "sys.id" to be present on the provided data',
        config.data,
      );

      expect(result).toEqual({
        isGQL: false,
        isREST: false,
        sysIds: [],
        isValid: false,
        config,
      });
    });

    describe('REST', () => {
      it('detects REST structure on the top level', () => {
        const config = {
          callback,
          data: {
            sys: { id: '123' },
            fields: {
              title: { 'en-US': 'Hello World' },
            },
          },
        };
        const result = validateLiveUpdatesConfiguration(config);

        expect(debug.error).not.toHaveBeenCalled();

        expect(result).toEqual({
          isGQL: false,
          isREST: true,
          sysIds: ['123'],
          isValid: true,
          config,
        });
      });

      it('detects REST structure inside lists', () => {
        const config = {
          callback,
          data: [
            {
              sys: { id: '123' },
              fields: {
                title: { 'en-US': 'Hello World' },
              },
            },
          ],
        };
        const result = validateLiveUpdatesConfiguration(config);

        expect(debug.error).not.toHaveBeenCalled();

        expect(result).toEqual({
          isGQL: false,
          isREST: true,
          sysIds: ['123'],
          isValid: true,
          config,
        });
      });

      it('detects REST structure in a nested structure', () => {
        const config = {
          callback,
          data: {
            items: [
              {
                sys: { id: '123' },
                fields: {
                  title: { 'en-US': 'Hello World' },
                },
              },
            ],
          },
        };
        const result = validateLiveUpdatesConfiguration(config);

        expect(debug.error).not.toHaveBeenCalled();

        expect(result).toEqual({
          isGQL: false,
          isREST: true,
          sysIds: ['123'],
          isValid: true,
          config,
        });
      });
    });

    describe('GraphQL', () => {
      it('detects GraphQL structure on the top level', () => {
        const config = {
          callback,
          data: {
            sys: { id: '123' },
            title: { 'en-US': 'Hello World' },
            __typename: 'hello',
          },
        };
        const result = validateLiveUpdatesConfiguration(config);

        expect(debug.error).not.toHaveBeenCalled();

        expect(result).toEqual({
          isGQL: true,
          isREST: false,
          sysIds: ['123'],
          isValid: true,
          config,
        });
      });

      it('detects GraphQL structure inside lists', () => {
        const config = {
          callback,
          data: [
            {
              sys: { id: '123' },
              title: { 'en-US': 'Hello World' },
              __typename: 'hello',
            },
          ],
        };
        const result = validateLiveUpdatesConfiguration(config);

        expect(debug.error).not.toHaveBeenCalled();

        expect(result).toEqual({
          isGQL: true,
          isREST: false,
          sysIds: ['123'],
          isValid: true,
          config,
        });
      });

      it('detects GraphQL structure in a nested structure', () => {
        const config = {
          callback,
          data: {
            collection: {
              items: [
                {
                  sys: { id: '123' },
                  title: { 'en-US': 'Hello World' },
                  __typename: 'hello',
                },
              ],
            },
          },
        };
        const result = validateLiveUpdatesConfiguration(config);

        expect(result).toEqual({
          isGQL: true,
          isREST: false,
          sysIds: ['123'],
          isValid: true,
          config,
          hasCSM: undefined,
        });
      });
    });

    describe('invalid', () => {
      it('warns about missing sys information', () => {
        const data = {
          title: { 'en-US': 'Hello World' },
          __typename: 'hello',
        };

        const config = {
          callback,
          data,
        };

        const result = validateLiveUpdatesConfiguration(config);

        expect(debug.error).toHaveBeenCalledTimes(1);
        expect(debug.error).toHaveBeenCalledWith(
          'Live Updates requires the "sys.id" to be present on the provided data',
          data,
        );

        expect(result).toEqual({
          isGQL: true,
          isREST: false,
          sysIds: [],
          isValid: false,
          config,
        });
      });

      it('warns that it is neither REST or GraphQL', () => {
        const data = {
          sys: { id: '1' },
        };
        const config = { callback, data };
        const result = validateLiveUpdatesConfiguration(config);

        expect(debug.error).toHaveBeenCalledTimes(1);
        expect(debug.error).toHaveBeenCalledWith(
          'For live updates as a basic requirement the provided data must include the "fields" property for REST or "__typename" for Graphql, otherwise the data will be treated as invalid and live updates are not applied.',
          data,
        );

        expect(result).toEqual({
          isGQL: false,
          isREST: false,
          sysIds: ['1'],
          isValid: false,
          config,
        });
      });
    });

    describe('multiple sysIds', () => {
      it('correctly resolves multiple sys ids for rest', () => {
        const data = {
          sys: { id: '1' },
          fields: {
            references: {
              items,
            },
          },
        };

        const config = {
          callback,
          data,
        };

        const result = validateLiveUpdatesConfiguration(config);

        expect(result).toEqual({
          isGQL: false,
          isREST: true,
          sysIds: [
            '1',
            '6c9tUMxxamKB9R7S16ne1X',
            '3Qnjx9WkvM4ZC44AIBDZwt',
            '4iZO00YnKE8I8c90VIUuhN',
            '6LznwSwpmSWNCMwbgmtB2L',
            '5BfEkkNsrAGLLJQukwIjrJ',
            'jYxVlZPpqdeZs93jmpAlF',
            '2Jv15oYNaOUzyyJEp5P5z4',
            '2SKWtzmGOnQm80nRGIIclu',
            '5YZ9fKKF3Vg9bNV7x3Xl08',
            '7wGhPNCZNLknpSaJVWfnHf',
            '7aKPwfpCJCy6mz7fefzNUi',
            '6wuDj6hgz4SOQuiq6f8UzX',
            '4OSewDgF5UsbHVwRNIIILi',
            '7evUFWi5oSKaGWo3ZHqiwq',
          ],
          isValid: true,
          config,
          hasCSM: undefined,
        });
      });

      it('correctly resolves multiple sys ids for graphql', () => {
        const data = {
          sys: { id: '1' },
          __typename: 'hello',
          references: {
            items,
          },
        };

        const config = {
          callback,
          data,
        };

        const result = validateLiveUpdatesConfiguration(config);

        expect(result).toEqual({
          isGQL: true,
          isREST: false,
          sysIds: [
            '1',
            '6c9tUMxxamKB9R7S16ne1X',
            '3Qnjx9WkvM4ZC44AIBDZwt',
            '4iZO00YnKE8I8c90VIUuhN',
            '6LznwSwpmSWNCMwbgmtB2L',
            '5BfEkkNsrAGLLJQukwIjrJ',
            'jYxVlZPpqdeZs93jmpAlF',
            '2Jv15oYNaOUzyyJEp5P5z4',
            '2SKWtzmGOnQm80nRGIIclu',
            '5YZ9fKKF3Vg9bNV7x3Xl08',
            '7wGhPNCZNLknpSaJVWfnHf',
            '7aKPwfpCJCy6mz7fefzNUi',
            '6wuDj6hgz4SOQuiq6f8UzX',
            '4OSewDgF5UsbHVwRNIIILi',
            '7evUFWi5oSKaGWo3ZHqiwq',
          ],
          isValid: true,
          config,
          hasCSM: undefined,
        });
      });
    });
  });

  describe('config.query', () => {
    it('does nothing if the provided query is valid', () => {
      const config = {
        callback,
        data: {
          sys: { id: '123' },
          title: { 'en-US': 'Hello World' },
          __typename: 'hello',
        },
        query: gql`
          query test {
            __typename
            sys {
              id
            }
            title
          }
        `,
      };

      const result = validateLiveUpdatesConfiguration(config);

      expect(debug.warn).not.toHaveBeenCalled();

      expect(result).toEqual({
        isGQL: true,
        isREST: false,
        sysIds: ['123'],
        isValid: true,
        config,
      });
    });

    it('parses the DocumentNode from the query string', () => {
      const config = {
        callback,
        data: {
          sys: { id: '123' },
          title: { 'en-US': 'Hello World' },
          __typename: 'hello',
        },
        query: gql`
          query test {
            __typename
            sys {
              id
            }
            title
          }
        `,
      };

      const result = validateLiveUpdatesConfiguration(config);

      expect(debug.warn).not.toHaveBeenCalled();

      expect(result).toEqual({
        isGQL: true,
        isREST: false,
        sysIds: ['123'],
        isValid: true,
        config: {
          ...config,
          query: gql`
            query test {
              __typename
              sys {
                id
              }
              title
            }
          `,
        },
      });
    });

    it('warns about invalid query and removes the query param', () => {
      const config = {
        callback,
        data: {
          sys: { id: '123' },
          title: { 'en-US': 'Hello World' },
          __typename: 'hello',
        },
        query: `
          __typename
          sys { id }
          title
        `,
      };

      const result = validateLiveUpdatesConfiguration(config);

      expect(debug.error).toHaveBeenCalledTimes(1);
      expect(debug.error).toHaveBeenCalledWith(
        'The provided GraphQL query is invalid, please provide it in the correct format.',
        config,
      );

      expect(result).toEqual({
        isGQL: true,
        isREST: false,
        sysIds: ['123'],
        isValid: true,
        config: {
          ...config,
          query: undefined,
        },
      });
    });

    it('warns about a query provided to REST and removes the query param', () => {
      const config = {
        callback,
        data: {
          sys: { id: '123' },
          fields: {
            title: { 'en-US': 'Hello World' },
          },
        },
        query: gql`
          query test {
            __typename
            sys {
              id
            }
            title
          }
        `,
      };

      const result = validateLiveUpdatesConfiguration(config);

      expect(debug.warn).toHaveBeenCalledTimes(1);
      expect(debug.warn).toHaveBeenCalledWith(
        'The query param is ignored as it can only be used together with GraphQL.',
        config,
      );

      expect(result).toEqual({
        isGQL: false,
        hasCSM: undefined,
        isREST: true,
        sysIds: ['123'],
        isValid: true,
        config: {
          ...config,
          query: undefined,
        },
      });
    });
  });
});
