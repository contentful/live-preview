import { describe, it, expect, vi, afterEach } from 'vitest';

import { debug } from '../helpers';
import { validateLiveUpdatesConfiguration } from '../helpers/validation';
import gql from 'graphql-tag';

vi.mock('../helpers/debug');

describe('validateLiveUpdatesConfiguration', () => {
  const callback = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('config.data', () => {
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
          sysId: '123',
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
          sysId: '123',
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
          sysId: '123',
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
          sysId: '123',
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
          sysId: '123',
          isValid: true,
          config,
        });
      });

      it('detects REST structure in a nested structure', () => {
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

        expect(debug.error).not.toHaveBeenCalled();

        expect(result).toEqual({
          isGQL: true,
          isREST: false,
          sysId: '123',
          isValid: true,
          config,
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
          data
        );

        expect(result).toEqual({
          isGQL: true,
          isREST: false,
          sysId: null,
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
          data
        );

        expect(result).toEqual({
          isGQL: false,
          isREST: false,
          sysId: '1',
          isValid: false,
          config,
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
        sysId: '123',
        isValid: true,
        config,
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
          query test {
            __typename
            sys { id }
            title
          }
        ` as any, // Needed to convince typescript, more a test for non typescript consumers
      };

      const result = validateLiveUpdatesConfiguration(config);

      expect(debug.warn).toHaveBeenCalledTimes(1);
      expect(debug.warn).toHaveBeenCalledWith(
        'The provided GraphQL query needs to be a `DocumentNode`, please provide it in the correct format.',
        config
      );

      expect(result).toEqual({
        isGQL: true,
        isREST: false,
        sysId: '123',
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
        config
      );

      expect(result).toEqual({
        isGQL: false,
        isREST: true,
        sysId: '123',
        isValid: true,
        config: {
          ...config,
          query: undefined,
        },
      });
    });
  });
});
