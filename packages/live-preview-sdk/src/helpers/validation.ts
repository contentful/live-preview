import { DocumentNode } from 'graphql';
import { gql } from 'graphql-tag';

import type { ContentfulSubscribeConfig } from '../index.js';
import { Argument, SubscribeCallback } from '../types.js';
import { debug } from './debug.js';

const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Checks if `key` is a direct property of `object`.
 * Refactored the previous Object.hasOwn implementation to this function
 * to avoid bug in web apps where Object.hasOwn is not available
 */
function has(object: Record<string, unknown>, key: string) {
  return object != null && hasOwnProperty.call(object, key);
}

type Validated = {
  isGQL: boolean;
  sysIds: string[];
  isREST: boolean;
  isValid: boolean;
  config: ValidatedConfig;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const collectSysIds = (obj: Record<string, any>, sysIds: string[], depth = 0, maxDepth = 10) => {
  // Stop recursion if maximum depth is reached
  if (depth > maxDepth) {
    return sysIds;
  }

  // If obj is an array, recursively call collectSysIds for each item
  if (Array.isArray(obj)) {
    for (const item of obj) {
      sysIds = collectSysIds(item, sysIds, depth + 1, maxDepth);
    }
  } // check if the object has a sys.id and add it to the list
  else if (typeof obj === 'object' && obj !== null) {
    // check if the object has a sys.id and add it to the list
    if (obj.sys && obj.sys.id) {
      sysIds.push(obj.sys.id);
    }

    // check if the object has rest fields (for skipping unnecessary depth)
    const nested = 'fields' in obj ? obj.fields : obj;

    for (const key in nested) {
      if (Object.prototype.hasOwnProperty.call(nested, key)) {
        const field = nested[key];

        // If field is an array, recursively call collectSysIds for each item
        if (Array.isArray(field)) {
          for (const item of field) {
            sysIds = collectSysIds(item, sysIds, depth + 1, maxDepth);
          }
        } else {
          // if fields is an object then get the sysIds from it
          sysIds = collectSysIds(field, sysIds, depth + 1, maxDepth);
        }
      }
    }
  }

  return Array.from(new Set(sysIds));
};

function validateData(d: Argument, maxDepth: number) {
  if (maxDepth === 0) {
    debug.error(
      'Max depth for validation of subscription data is reached, please provide your data in the correct format.',
    );
    return { isGQL: false, sysIds: [], isREST: false };
  }

  if (Array.isArray(d)) {
    const result: Omit<Validated, 'isValid' | 'config'> = {
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
    const sysId = (d.sys?.id as string) ?? null;
    const isREST = has(d, 'fields');
    const sysIds: string[] = sysId ? [sysId] : [];

    // if the sysId is present & we don't have rest/graphql info, we don't need to go deeper
    if (sysId && !isGQL && !isREST) {
      return { isGQL, sysIds, isREST };
    }

    // If it's GQL or REST, we need to collect the sys ids
    if (isGQL || isREST) {
      return { isGQL, sysIds: collectSysIds(d, sysIds, 0, maxDepth), isREST };
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
) & { isGQL: boolean; isREST: boolean; sysIds: string[]; config: ValidatedConfig };

/**
 * @TODO: We are going to remove this in this ticket https://contentful.atlassian.net/browse/TOL-1872?atlOrigin=eyJpIjoiNDY2ZjMyZGY0NzMyNGFiMTg1ODY1MjgwOGM3MzQ0OTkiLCJwIjoiaiJ9
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
