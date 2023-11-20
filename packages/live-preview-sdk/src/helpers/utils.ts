import { DocumentNode, SelectionNode } from 'graphql';

import { version } from '../../package.json';
import { LIVE_PREVIEW_SDK_SOURCE } from '../constants';
import type { EditorMessage, MessageFromSDK } from '../messages';
import { PostMessageMethods } from '../messages';
import { debug } from './debug';

type Params = Map<string, { alias: Map<string, string>; fields: Set<string> }>;
type Generated = { __typename: string; alias?: string; name: string };
const COLLECTION_SUFFIX = 'Collection';

/**
 * Sends the given message to the editor
 * enhances it with the information necessary to be accepted
 */
export function sendMessageToEditor(
  method: PostMessageMethods,
  data: EditorMessage,
  targetOrigin: string[]
): void {
  const message = {
    ...data,
    method,
    from: 'live-preview',
    source: LIVE_PREVIEW_SDK_SOURCE,
    location: window.location.href,
    version,
  } as MessageFromSDK;

  debug.log('Send message', message);

  targetOrigin.forEach((origin) => {
    window.top?.postMessage(message, origin);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Callback = (...args: any[]) => void;
type DebouncedFunction<T extends Callback> = (...args: Parameters<T>) => void;

export function debounce<T extends Callback>(func: T, timeout = 100): DebouncedFunction<T> {
  let timer: NodeJS.Timeout;

  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      // @ts-expect-error `this` is untyped
      func.apply(this, args);
    }, timeout);
  };
}

/**
 * Map with integrated persistence layer to save/restore data during the session
 */
export class StorageMap<T extends unknown> {
  private storageKey: string;
  private value: Map<string, T>;

  constructor(key: string, defaultValue: Map<string, T>) {
    this.storageKey = key;
    this.value = this.restoreSessionData() || defaultValue;
  }

  private getKey(key: string, locale: string) {
    return `${key}-${locale}`;
  }

  private restoreSessionData() {
    try {
      const item = window.sessionStorage.getItem(this.storageKey);
      const parsed = item ? JSON.parse(item) : null;
      return Array.isArray(parsed) ? new Map<string, T>(parsed) : null;
    } catch (err) {
      return null;
    }
  }

  public get(key: string, locale: string): T | undefined {
    return this.value.get(this.getKey(key, locale));
  }

  public set(key: string, locale: string, data: T): void {
    this.value.set(this.getKey(key, locale), data);

    try {
      // Attention: Map can not be `JSON.stringify`ed directly
      window.sessionStorage.setItem(
        this.storageKey,
        JSON.stringify(Array.from(this.value.entries()))
      );
    } catch (err) {
      debug.warn(`StorageMap: Failed to set data for key "${key}" in sessionStorage`);
    }
  }

  public clear(): void {
    this.value.clear();
    try {
      window.sessionStorage.removeItem(this.storageKey);
    } catch (err) {
      debug.warn('StorageMap: Failed to clear data from sessionStorage');
    }
  }
}

/**
 * GraphQL returns the URL with protocol and the CMA without it,
 * so we need to add the information in there manually.
 */
export function setProtocolToHttps(url: string | undefined): string | undefined {
  if (!url) {
    return url;
  }

  try {
    // new URL('//images.ctfassets.net') is invalid, therefore we add it with protocol as `base`.
    // This will merge it then correct together
    const parsed = new URL(url, 'https://images.ctfassets.net');
    parsed.protocol = 'https:';
    return parsed.href;
  } catch (err) {
    debug.error(`Received invalid asset url "${url}"`, err);
    return url;
  }
}

/**
 * Clones the incoming element into a new one, to prevent modification on the original object
 * Hint: It uses the structuredClone which is only available in modern browsers,
 * for older one it uses the JSON.parse(JSON.strinfify) hack.
 */
export function clone<T extends Record<string, unknown> | Array<unknown>>(incoming: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(incoming);
  }

  try {
    return JSON.parse(JSON.stringify(incoming));
  } catch (err) {
    debug.warn('Failed to clone data, updates are done on the original one', incoming, err);
    return incoming;
  }
}

/** Detects if the current page is shown inside an iframe */
export function isInsideIframe(): boolean {
  try {
    return window.top?.location.href !== window.location.href;
  } catch (err) {
    // window.top.location.href is not accessable for non same origin iframes
    return true;
  }
}

/**
 * Takes a list of graphql fields and extract the field names and aliases for the live update processing
 */
export function gatherFieldInformation(
  selections: Readonly<SelectionNode[]>,
  typename: string
): Generated[] {
  const generated: Array<Generated> = [];

  for (const selection of selections) {
    if (selection.kind === 'Field') {
      generated.push({
        name: selection.name.value,
        alias: selection.alias?.value,
        __typename: typename,
      });

      if (selection.selectionSet?.selections) {
        generated.push(
          ...gatherFieldInformation(
            selection.selectionSet.selections,
            getTypeName(selection, typename)
          )
        );
      }
    }
  }

  return generated;
}

/**
 * Parses the GraphQL query information and extracts the information,
 * we're using for processing the live updates (requested fields, alias)
 */
export function parseGraphQLParams(query: DocumentNode): Params {
  const generated: Array<Generated> = [];

  for (const def of query.definitions) {
    if (def.kind === 'OperationDefinition' || def.kind === 'FragmentDefinition') {
      const typename = 'typeCondition' in def ? def.typeCondition.name.value : def.name?.value;

      if (!typename) {
        console.warn('Could not generate __typename for query definition', def);
        continue;
      }

      for (const selection of def.selectionSet.selections) {
        if (selection.kind === 'Field') {
          generated.push(...gatherFieldInformation(def.selectionSet.selections, typename));
        }
      }
    }
  }

  // Transform the list of GraphQL information into a Map for faster access
  // (by __typename)
  const params: Params = new Map();
  for (const { __typename, alias, name } of generated) {
    const match = params.get(__typename) || {
      alias: new Map<string, string>(),
      fields: new Set<string>(),
    };

    match.fields.add(name);
    if (alias) {
      match.alias.set(name, alias);
    }

    params.set(__typename, match);
  }

  return params;
}

/**
 * Generates the typename for the next node
 * If it's inside a collection it will provide the typename from the collection name
 */
export function getTypeName(selection: { name: { value: string } }, prevTypeName: string): string {
  if (selection.name.value === 'items') {
    return extractNameFromCollectionName(prevTypeName) || selection.name.value;
  }

  return selection.name.value;
}

/**
 * Extract the name of an entry from the collection (e.g. "postCollection" => "Post")
 * Returns undefined if the name doesn't has the collection suffix.
 */
export function extractNameFromCollectionName(collection: string): string | undefined {
  if (!collection.endsWith(COLLECTION_SUFFIX)) {
    return undefined;
  }

  return generateTypeName(collection.replace(COLLECTION_SUFFIX, ''));
}

/**
 * Generates the type name by capitalizing the first letter of the content type ID.
 *
 * @param {string} contentTypeId - The content type ID.
 * @return {string} The generated type name.
 */
export function generateTypeName(contentTypeId: string): string {
  return contentTypeId.charAt(0).toUpperCase() + contentTypeId.slice(1);
}
