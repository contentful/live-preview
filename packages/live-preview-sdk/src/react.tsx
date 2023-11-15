'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import { DocumentNode } from 'graphql';
import isEqual from 'lodash.isequal';

import { debounce } from './helpers';
import { ContentfulLivePreview, ContentfulLivePreviewInitConfig } from './index';
import type { InspectorModeTags } from './inspectorMode/types';
import { Argument, LivePreviewProps } from './types';

type UseEffectParams = Parameters<typeof useEffect>;
type EffectCallback = UseEffectParams[0];
type DependencyList = UseEffectParams[1];
type UseEffectReturn = ReturnType<typeof useEffect>;

export function useDeepCompareMemoize<T>(value: T) {
  const ref = useRef<T>(value);
  const signalRef = useRef<number>(0);

  if (!isEqual(value, ref.current)) {
    ref.current = value;
    signalRef.current += 1;
  }

  return useMemo(() => ref.current, [signalRef.current]);
}

export function useDeepCompareEffectNoCheck(
  callback: EffectCallback,
  dependencies: DependencyList
): UseEffectReturn {
  return useEffect(callback, useDeepCompareMemoize(dependencies));
}

const ContentfulLivePreviewContext = createContext<ContentfulLivePreviewInitConfig | null>(null);

/**
 * ContentfulLivePreviewProvider to initialize the the SDK and provide the config for the live updates
 * Essential to wrap it around the whole react tree, where you want to use live updates and inspector mode.
 */
export function ContentfulLivePreviewProvider({
  children,
  locale,
  debugMode = false,
  enableInspectorMode = true,
  enableLiveUpdates = true,
  targetOrigin,
}: PropsWithChildren<ContentfulLivePreviewInitConfig>): ReactElement {
  if (!locale) {
    throw new Error(
      'ContentfulLivePreviewProvider have to be called with a locale property (for example: `<ContentfulLivePreviewProvider locale="en-US">{children}</ContentfulLivePreviewProvider>`'
    );
  }

  ContentfulLivePreview.init({
    locale,
    debugMode,
    enableInspectorMode,
    enableLiveUpdates,
    targetOrigin,
  });

  const props = useMemo(
    () => ({ locale, debugMode, enableInspectorMode, enableLiveUpdates, targetOrigin }),
    [locale, debugMode, enableInspectorMode, enableLiveUpdates, targetOrigin]
  );

  return (
    <ContentfulLivePreviewContext.Provider value={props}>
      {children}
    </ContentfulLivePreviewContext.Provider>
  );
}

interface Options {
  locale?: string;
  /** GraphQL query related to the provided data */
  query?: DocumentNode;

  skip?: boolean;
}

export function useContentfulLiveUpdates<T extends Argument | null | undefined>(
  data: T,
  options?: Options
): T;
/**
 * @deprecated in favor of `options`
 */
export function useContentfulLiveUpdates<T extends Argument | null | undefined>(
  data: T,
  locale?: string,
  skip?: boolean
): T;
/**
 * Receives updates directly from the Contentful Editor inside the LivePreview
 * Attention: For this to work, the provided data should contain a `sys.id` information
 * and for GraphQL the `__typename`. Otherwise the data will not be updated.
 * Transformed data can't be updated yet, please provide the original data from CPA/CDA.
 */
export function useContentfulLiveUpdates<T extends Argument | null | undefined>(
  data: T,
  optionsOrLocale?: Options | string,
  skip = false
): T {
  const [state, setState] = useState({ data, version: 1 });
  const previous = useRef(data);
  const update = useRef(debounce(setState));
  const config = useContext(ContentfulLivePreviewContext);

  const options =
    typeof optionsOrLocale === 'object' ? optionsOrLocale : { locale: optionsOrLocale, skip };

  const shouldSubscribe = useMemo(() => {
    if (config && !config.enableLiveUpdates) {
      return false;
    }

    if (options.skip) {
      return false;
    }

    if (Array.isArray(data) && data.length) {
      return true;
    }

    if (data && typeof data === 'object' && Object.keys(data).length) {
      return true;
    }

    return false;
  }, [config, options.skip, data]);

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
    return ContentfulLivePreview.subscribe('edit', {
      data: data as Argument,
      locale: options.locale,
      query: options.query,
      callback: (updatedData) => {
        // Update the state and adding a version number to it, as some deep nested updates
        // are not proceeded correctly otherwise
        update.current((prevState) => ({ data: updatedData as T, version: prevState.version + 1 }));
      },
    });
  }, [data, shouldSubscribe, options.locale, options.query]);

  return state.data;
}

type GetInspectorModeProps<T> = (
  props: {
    [K in Exclude<keyof LivePreviewProps, keyof T | 'locale'>]: LivePreviewProps[K];
  } & { locale?: LivePreviewProps['locale'] }
) => InspectorModeTags;

/**
 * Generates the function to build the required properties for the inspector mode (field tagging)
 */
export function useContentfulInspectorMode<
  T = undefined | Pick<LivePreviewProps, 'entryId'> | Pick<LivePreviewProps, 'entryId' | 'fieldId'>
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
