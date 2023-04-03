import { useRef, useState } from 'react';

import { useDeepCompareEffectNoCheck } from 'use-deep-compare-effect';

import { ContentfulLivePreview } from '.';
import { debounce } from './helpers';
import { Argument } from './types';

export function useContentfulLiveUpdates<T extends Argument | null | undefined>(
  data: T,
  locale: string,
  skip?: boolean
): T {
  const [state, setState] = useState({ data, version: 1 });
  const update = useRef(debounce(setState));

  useDeepCompareEffectNoCheck(() => {
    // update content from external
    setState((prev) => ({ data, version: prev.version + 1 }));
    // nothing to merge if there is no data
    if (skip || !data || (Array.isArray(data) && !data.length) || !Object.keys(data).length) {
      return;
    }
    // or update content through live updates
    return ContentfulLivePreview.subscribe(data, locale, (data) => {
      update.current((prev) => ({ data: data as T, version: prev.version + 1 }));
    });
  }, [data]);

  return state.data;
}
