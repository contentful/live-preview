import { useState } from 'react';

import { useDeepCompareEffectNoCheck } from 'use-deep-compare-effect';

import { ContentfulLivePreview } from '.';
import { Argument } from './types';
import { debounce } from './utils';

export function useContentfulLiveUpdates<T extends Argument | null | undefined>(
  data: T,
  locale: string
): T {
  const [state, setState] = useState(data);

  useDeepCompareEffectNoCheck(() => {
    // update content from external
    setState(data);
    // nothing to merge if there is no data
    if (!data || (Array.isArray(data) && !data.length) || !Object.keys(data).length) {
      return;
    }
    // or update content through live updates
    const update = debounce(setState);
    return ContentfulLivePreview.subscribe(data, locale, (data) => update(data as T));
  }, [data]);

  return state;
}
