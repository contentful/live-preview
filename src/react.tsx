import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import { useDeepCompareEffectNoCheck } from 'use-deep-compare-effect';

import { ContentfulLivePreview, ContentfulLivePreviewInitConfig } from '.';
import { debounce } from './helpers';
import { Argument, InspectorModeTags, LivePreviewProps } from './types';

const ContentfulLivePreviewContext = createContext<ContentfulLivePreviewInitConfig | null>(null);

/**
 * ContentfulLivePreviewProvider to initialize the the SDK and provide the config for the live updates
 * Essential to wrap it around the whole react tree, where you want to use live updates and inspector mode.
 */
export function ContentfulLivePreviewProvider({
  children,
  debugMode = false,
  enableInspectorMode = true,
  enableLiveUpdates = true,
}: PropsWithChildren<ContentfulLivePreviewInitConfig>): ReactElement {
  ContentfulLivePreview.init({ debugMode, enableInspectorMode, enableLiveUpdates });

  return (
    <ContentfulLivePreviewContext.Provider
      value={{ debugMode, enableInspectorMode, enableLiveUpdates }}
    >
      {children}
    </ContentfulLivePreviewContext.Provider>
  );
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
  const config = useContext(ContentfulLivePreviewContext);

  const shouldSubscribe = useMemo(() => {
    if (config && !config.enableLiveUpdates) {
      return false;
    }

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
  }, [config, skip, data]);

  useDeepCompareEffectNoCheck(() => {
    if (previous.current !== data) {
      // update content from external
      setState({ data, version: 1 });
      previous.current = data;
    }

    // nothing to merge if there is no data
    if (!shouldSubscribe) {
      return;
    }
    // or update content through live updates
    return ContentfulLivePreview.subscribe(data as Argument, locale, (updatedData) => {
      // Update the state and adding a version number to it, as some deep nested updates
      // are not proceeded correctly otherwise
      update.current((prevState) => ({ data: updatedData as T, version: prevState.version++ }));
    });
  }, [data, shouldSubscribe]);

  return state.data;
}

type GetInspectorModeProps<T> = (props: {
  [K in Exclude<keyof LivePreviewProps, keyof T>]: LivePreviewProps[K];
}) => InspectorModeTags;

/**
 * Generates the function to build the required properties for the inspector mode (field tagging)
 */
export function useContentfulInspectorMode<
  T = undefined | Pick<LivePreviewProps, 'entryId'> | Pick<LivePreviewProps, 'entryId' | 'locale'>
>(sharedProps?: T): GetInspectorModeProps<T> {
  const config = useContext(ContentfulLivePreviewContext);

  return useCallback(
    (props) => {
      if (config?.enableInspectorMode) {
        return ContentfulLivePreview.getProps({ ...sharedProps, ...props } as LivePreviewProps);
      }

      return null;
    },
    [config?.enableInspectorMode, sharedProps]
  );
}
