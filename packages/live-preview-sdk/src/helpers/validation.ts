import { Argument } from '../types';
import { debug } from './debug';

function validation(d: Argument): { isGQL: boolean; hasSys: boolean; isREST: boolean } {
  if (Array.isArray(d)) {
    for (const value of d) {
      const result = validation(value);

      if (Object.values(result).includes(true)) {
        return result;
      }
    }

    return { isGQL: false, hasSys: false, isREST: false };
  } else {
    const isGQL = Object.hasOwn(d, '__typename');
    const hasSys = Object.hasOwn(d, 'sys');
    const isREST = Object.hasOwn(d, 'fields');

    if (isGQL || hasSys || isREST) {
      return { isGQL, hasSys, isREST };
    }

    // maybe it's nested
    return validation(Object.values(d) as Argument);
  }
}

/**
 * **Basic** validating of the subscribed data
 * Is it GraphQL or REST and does it contain the sys information
 */
export function validateDataForLiveUpdates(data: Argument): {
  isGQL: boolean;
  isREST: boolean;
  hasSys: boolean;
  isValid: boolean;
} {
  let isValid = true;

  const { isGQL, hasSys, isREST } = validation(data);

  if (!hasSys) {
    isValid = false;
    debug.error('Live Updates requires the "sys.id" to be present on the provided data', data);
  }

  if (!isGQL && !isREST) {
    isValid = false;
    debug.error(
      'For live updates as a basic requirement the provided data must include the "fields" property for REST or "__typename" for Graphql, otherwise the data will be treated as invalid and live updates are not applied.',
      data
    );
  }

  return {
    isGQL,
    isREST,
    hasSys,
    isValid,
  };
}
