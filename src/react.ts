import { useState } from 'react';

import useDeepCompareEffect from 'use-deep-compare-effect';

import { ContentfulLivePreview } from '.';
import { Entity } from './types';

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
    return ContentfulLivePreview.subscribe(data, locale, (data) => {
      setState(data as T);
    });
  }, [data]);

  return state;
}
