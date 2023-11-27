import { Argument } from '../types';
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

function validation(d: Argument): { isGQL: boolean; sysId: string | null; isREST: boolean } {
  if (Array.isArray(d)) {
    for (const value of d) {
      const result = validation(value);

      if (Object.values(result).includes(true)) {
        return result;
      }
    }

    return { isGQL: false, sysId: null, isREST: false };
  } else {
    const isGQL = has(d, '__typename');
    const sysId = d.sys?.id ?? null;
    const isREST = has(d, 'fields');

    if (isGQL || sysId || isREST) {
      return { isGQL, sysId, isREST };
    }

    // maybe it's nested
    return validation(Object.values(d) as Argument);
  }
}

type ValidationResult = (
  | {
      isValid: true;
      sysId: string;
    }
  | {
      isValid: false;
      sysId: string | null;
    }
) & { isGQL: boolean; isREST: boolean };

/**
 * **Basic** validating of the subscribed data
 * Is it GraphQL or REST and does it contain the sys information
 */
export function validateDataForLiveUpdates(data: Argument): ValidationResult {
  const { isGQL, sysId, isREST } = validation(data);

  if (!sysId) {
    debug.error('Live Updates requires the "sys.id" to be present on the provided data', data);
    return {
      isValid: false,
      sysId,
      isGQL,
      isREST,
    };
  }

  if (!isGQL && !isREST) {
    debug.error(
      'For live updates as a basic requirement the provided data must include the "fields" property for REST or "__typename" for Graphql, otherwise the data will be treated as invalid and live updates are not applied.',
      data
    );
    return {
      isValid: false,
      sysId,
      isGQL,
      isREST,
    };
  }

  return {
    isGQL,
    isREST,
    sysId,
    isValid: true,
  };
}
