import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';

import type { ContentfulSubscribeConfig } from '..';

import { Argument, SubscribeCallback } from '../types';
import { debug } from './debug';

const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Checks if `key` is a direct property of `object`.
 * Refactored the previous Object.hasOwn implementation to this function
 * to avoid bug in web apps where Object.hasOwn is not available
 */
function has(object: Record<string, unknown>, key: string) {
  return object != null && hasOwnProperty.call(object, key);
}

function validateData(d: Argument, maxDepth: number): Omit<ValidationResult, 'isValid' | 'config'> {
  if (maxDepth === 0) {
    debug.error(
      'Max depth for validation of subscription data is reached, please provide your data in the correct format.',
    );
    return { isGQL: false, sysIds: [], isREST: false };
  }

  if (Array.isArray(d)) {
    const result: Omit<ValidationResult, 'isValid' | 'config'> = {
      isGQL: false,
      sysIds: [],
      isREST: false,
    };

    for (const value of d) {
      const currentResult = validateData(value, maxDepth - 1);

      result.isGQL = result.isGQL || currentResult.isGQL;
      result.isREST = result.isREST || currentResult.isREST;
      result.sysIds = [...result.sysIds, ...currentResult.sysIds];
    }

    return result;
  } else {
    const isGQL = has(d, '__typename');
    const sysId = d.sys?.id ?? null;
    const isREST = has(d, 'fields');

    if (isGQL || sysId || isREST) {
      return { isGQL, sysIds: sysId ? [sysId] : [], isREST };
    }

    // maybe it's nested
    return validateData(Object.values(d) as Argument, maxDepth - 1);
  }
}

function validatedConfig(
  originalConfig: ContentfulSubscribeConfig,
  isREST: boolean,
): ValidatedConfig {
  const config = { ...originalConfig };

  if (config.query) {
    if (typeof config.query === 'string') {
      try {
        config.query = gql(config.query);
      } catch (error) {
        debug.error(
          'The provided GraphQL query is invalid, please provide it in the correct format.',
          originalConfig,
        );
        config.query = undefined;
      }
    }

    if (isREST) {
      debug.warn(
        'The query param is ignored as it can only be used together with GraphQL.',
        originalConfig,
      );
      config.query = undefined;
    }
  }

  return config as ValidatedConfig;
}

type ValidatedConfig = {
  data: Argument;
  locale?: string;
  callback: SubscribeCallback;
  query?: DocumentNode;
};

type ValidationResult = (
  | {
      isValid: true;
      sysIds: string[];
    }
  | {
      isValid: false;
      sysIds: string[];
    }
) & { isGQL: boolean; isREST: boolean; config: ValidatedConfig };

/**
 * **Basic** validating of the subscribed configuration
 * Is it GraphQL or REST and does it contain the sys information
 */
export function validateLiveUpdatesConfiguration(
  originalConfig: ContentfulSubscribeConfig,
): ValidationResult {
  const { isGQL, isREST, sysIds } = validateData(originalConfig.data, 10);
  const config = validatedConfig(originalConfig, isREST);

  if (sysIds.length === 0) {
    debug.error(
      'Live Updates requires the "sys.id" to be present on the provided data',
      config.data,
    );
    return {
      isValid: false,
      sysIds,
      isGQL,
      isREST,
      config,
    };
  }

  if (!isGQL && !isREST) {
    debug.error(
      'For live updates as a basic requirement the provided data must include the "fields" property for REST or "__typename" for Graphql, otherwise the data will be treated as invalid and live updates are not applied.',
      config.data,
    );
    return {
      isValid: false,
      sysIds,
      isGQL,
      isREST,
      config,
    };
  }

  return {
    isGQL,
    isREST,
    sysIds,
    isValid: true,
    config,
  };
}
