import { useRef, useState } from 'react';

import { useDeepCompareEffectNoCheck } from 'use-deep-compare-effect';

import { ContentfulLivePreview } from '.';
import { debounce } from './helpers';
import { Argument } from './types';

function shouldSubscribe(skip: boolean, data: Argument | null | undefined): boolean {
  if (skip) {
    return false;
  }

  if (Array.isArray(data) && data.length) {
    return true;
  }

  if (data && typeof data === 'object' && Object.keys(data).length) {
    return true;
  }

  return false;
}

/**
 * Receives updates directly from the Contentful Editor inside the LivePreview
 * Attention: For this to work, the provided data should contain a `sys.id` information
 * and for GraphQL the `__typename`. Otherwise the data will not be updated.
 * Transformed data can't be updated yet, please provide the original data from CPA/CDA.
 */
export function useContentfulLiveUpdates<T extends Argument | null | undefined>(
  data: T,
  locale: string,
  skip = false
): T {
  const [state, setState] = useState({ data, version: 1 });
  const previous = useRef(data);
  const update = useRef(debounce(setState));

  useDeepCompareEffectNoCheck(() => {
    if (previous.current !== data) {
      // update content from external
      setState({ data, version: 1 });
      previous.current = data;
    }

    // nothing to merge if there is no data
    if (!shouldSubscribe(skip, data)) {
      return;
    }
    // or update content through live updates
    return ContentfulLivePreview.subscribe(data as Argument, locale, (updatedData) => {
      // Update the state and adding a version number to it, as some deep nested updates
      // are not proceeded correctly otherwise
      update.current((prevState) => ({ data: updatedData as T, version: prevState.version++ }));
    });
  }, [data]);

  return state.data;
}
