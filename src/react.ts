import { useEffect, useState } from 'react';

import { ContentfulLivePreview } from '.';
import { Entity } from './live-updates';

export function useContentfulLiveUpdates<T extends Entity | null | undefined>(
  data: T,
  locale: string
): T {
  const [state, setState] = useState(data);

  useEffect(() => {
    // update content from external
    setState(data);
    // nothing to merge if there are no data
    if (!data) {
      return;
    }
    // or update content through live udates
    return ContentfulLivePreview.subscribe(data, locale, (data) => {
      setState(data as T);
    });
  }, [JSON.stringify(data)]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
