import { describe, it, expect, vi, afterEach } from 'vitest';

import { debug } from '../helpers';
import { validateDataForLiveUpdates } from '../helpers/validation';

vi.mock('../helpers/debug');

describe('validateDataForLiveUpdates', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('REST', () => {
    it('detects REST structure on the top level', () => {
      const result = validateDataForLiveUpdates({
        sys: { id: '123' },
        fields: {
          title: { 'en-US': 'Hello World' },
        },
      });

      expect(debug.error).not.toHaveBeenCalled();

      expect(result).toEqual({
        isGQL: false,
        isREST: true,
        hasSys: true,
        isValid: true,
      });
    });

    it('detects REST structure inside lists', () => {
      const result = validateDataForLiveUpdates([
        {
          sys: { id: '123' },
          fields: {
            title: { 'en-US': 'Hello World' },
          },
        },
      ]);

      expect(debug.error).not.toHaveBeenCalled();

      expect(result).toEqual({
        isGQL: false,
        isREST: true,
        hasSys: true,
        isValid: true,
      });
    });

    it('detects REST structure in a nested structure', () => {
      const result = validateDataForLiveUpdates({
        items: [
          {
            sys: { id: '123' },
            fields: {
              title: { 'en-US': 'Hello World' },
            },
          },
        ],
      });

      expect(debug.error).not.toHaveBeenCalled();

      expect(result).toEqual({
        isGQL: false,
        isREST: true,
        hasSys: true,
        isValid: true,
      });
    });
  });

  describe('GraphQL', () => {
    it('detects GraphQL structure on the top level', () => {
      const result = validateDataForLiveUpdates({
        sys: { id: '123' },
        title: { 'en-US': 'Hello World' },
        __typename: 'hello',
      });

      expect(debug.error).not.toHaveBeenCalled();

      expect(result).toEqual({
        isGQL: true,
        isREST: false,
        hasSys: true,
        isValid: true,
      });
    });

    it('detects REST structure inside lists', () => {
      const result = validateDataForLiveUpdates([
        {
          sys: { id: '123' },
          title: { 'en-US': 'Hello World' },
          __typename: 'hello',
        },
      ]);

      expect(debug.error).not.toHaveBeenCalled();

      expect(result).toEqual({
        isGQL: true,
        isREST: false,
        hasSys: true,
        isValid: true,
      });
    });

    it('detects REST structure in a nested structure', () => {
      const result = validateDataForLiveUpdates({
        collection: {
          items: [
            {
              sys: { id: '123' },
              title: { 'en-US': 'Hello World' },
              __typename: 'hello',
            },
          ],
        },
      });

      expect(debug.error).not.toHaveBeenCalled();

      expect(result).toEqual({
        isGQL: true,
        isREST: false,
        hasSys: true,
        isValid: true,
      });
    });
  });

  describe('invalid', () => {
    it('warns about missing sys information', () => {
      const data = {
        title: { 'en-US': 'Hello World' },
        __typename: 'hello',
      };
      const result = validateDataForLiveUpdates(data);

      expect(debug.error).toHaveBeenCalledTimes(1);
      expect(debug.error).toHaveBeenCalledWith(
        'Live Updates requires the "sys.id" to be present on the provided data',
        data
      );

      expect(result).toEqual({
        isGQL: true,
        isREST: false,
        hasSys: false,
        isValid: false,
      });
    });

    it('warns that it is neither REST or GraphQL', () => {
      const data = {
        sys: { id: '1' },
      };
      const result = validateDataForLiveUpdates(data);

      expect(debug.error).toHaveBeenCalledTimes(1);
      expect(debug.error).toHaveBeenCalledWith(
        'For live updates as a basic requirement the provided data must include the "fields" property for REST or "__typename" for Graphql, otherwise the data will be treated as invalid and live updates are not applied.',
        data
      );

      expect(result).toEqual({
        isGQL: false,
        isREST: false,
        hasSys: true,
        isValid: false,
      });
    });
  });
});
