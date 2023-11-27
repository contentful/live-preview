import type { ContentfulSubscribeConfig } from '..';
import { Argument } from '../types';
import { debug } from './debug';

// FIXME: don't go down infinite
function validateData(d: Argument): { isGQL: boolean; sysId: string | null; isREST: boolean } {
  if (Array.isArray(d)) {
    for (const value of d) {
      const result = validateData(value);

      if (Object.values(result).includes(true)) {
        return result;
      }
    }

    return { isGQL: false, sysId: null, isREST: false };
  } else {
    const isGQL = Object.hasOwn(d, '__typename');
    const sysId = Object.hasOwn(d, 'sys') ? d.sys.id : null;
    const isREST = Object.hasOwn(d, 'fields');

    if (isGQL || sysId || isREST) {
      return { isGQL, sysId, isREST };
    }

    // maybe it's nested
    return validateData(Object.values(d) as Argument);
  }
}

function validatedConfig(originalConfig: ContentfulSubscribeConfig, isREST: boolean) {
  const config = { ...originalConfig };

  if (config.query) {
    if (typeof config.query !== 'object') {
      debug.warn(
        'The provided GraphQL query needs to be a `DocumentNode`, please provide it in the correct format.',
        originalConfig
      );
      config.query = undefined;
    }

    if (isREST) {
      debug.warn(
        'The query param is ignored as it can only be used together with GraphQL.',
        originalConfig
      );
      config.query = undefined;
    }
  }

  return config;
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
) & { isGQL: boolean; isREST: boolean; config: ContentfulSubscribeConfig };

/**
 * **Basic** validating of the subscribed configuration
 * Is it GraphQL or REST and does it contain the sys information
 */
export function validateLiveUpdatesConfiguration(
  originalConfig: ContentfulSubscribeConfig
): ValidationResult {
  const { isGQL, isREST, sysId } = validateData(originalConfig.data);
  const config = validatedConfig(originalConfig, isREST);

  if (!sysId) {
    debug.error(
      'Live Updates requires the "sys.id" to be present on the provided data',
      config.data
    );
    return {
      isValid: false,
      sysId,
      isGQL,
      isREST,
      config,
    };
  }

  if (!isGQL && !isREST) {
    debug.error(
      'For live updates as a basic requirement the provided data must include the "fields" property for REST or "__typename" for Graphql, otherwise the data will be treated as invalid and live updates are not applied.',
      config.data
    );
    return {
      isValid: false,
      sysId,
      isGQL,
      isREST,
      config,
    };
  }

  return {
    isGQL,
    isREST,
    sysId,
    isValid: true,
    config,
  };
}
