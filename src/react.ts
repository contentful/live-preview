import { useState } from 'react';

import useDeepCompareEffect from 'use-deep-compare-effect';

import { ContentfulLivePreview } from '.';
import { Entity } from './types';
import { debounce } from './utils';

export function useContentfulLiveUpdates<T extends Entity | null | undefined>(
  data: T,
  locale: string
): T {
  const [state, setState] = useState(data);

  useDeepCompareEffect(() => {
    // update content from external
    setState(data);
    // nothing to merge if there are no data
    if (!data) {
      return;
    }
    // or update content through live updates
    const update = debounce(setState);
    return ContentfulLivePreview.subscribe(data, locale, (data) => update(data as T));
  }, [data]);

  return state;
}
