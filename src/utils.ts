import type { MessageAction } from './types';

type IframeConnectedMessage = {
  action: MessageAction.IFRAME_CONNECTED;
  data: { connected: true; tags: number };
};
type TaggedFieldClickMessage = {
  action: MessageAction.TAGGED_FIELD_CLICKED;
  data: { fieldId: string; entryId: string; locale: string };
};
type UnknownEntityMessage = {
  action: MessageAction.ENTITY_NOT_KNOWN;
  data: { referenceEntityId: string };
};

type EditorMessage = IframeConnectedMessage | TaggedFieldClickMessage | UnknownEntityMessage;
/**
 * Sends the given message to the editor
 * enhances it with the information necessary to be accepted
 */
export function sendMessageToEditor({ action, data }: EditorMessage): void {
  window.top?.postMessage(
    {
      from: 'live-preview',
      location: window.location.href,
      action,
      ...data,
    },
    // TODO: check if there is any security risk with this
    '*'
  );
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
 * Cheap solution to generate a unique ID
 */
export function generateUID(): string {
  return `${performance.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Map with integrated persistence layer to save/restore data during the session
 */
export class StorageMap<T extends unknown> {
  private storageKey: string;
  private value: Map<string, T>;
  // TODO: https://contentful.atlassian.net/browse/TOL-1080
  private persistence = false;

  constructor(key: string, defaultValue: Map<string, T>, persistence = false) {
    this.storageKey = key;
    this.persistence = persistence;
    this.value = this.restoreSessionData() || defaultValue;
  }

  private restoreSessionData() {
    if (!this.persistence) {
      return null;
    }

    try {
      const item = window.sessionStorage.getItem(this.storageKey);
      const parsed = item ? (JSON.parse(item) as T) : null;
      return Array.isArray(parsed) ? new Map<string, T>(parsed) : null;
    } catch (err) {
      return null;
    }
  }

  public get(key: string): T | undefined {
    return this.value.get(key);
  }

  public set(key: string, data: T): void {
    this.value.set(key, data);

    if (this.persistence) {
      try {
        // Attention: Map can not be `JSON.stringify`ed directly
        window.sessionStorage.setItem(
          this.storageKey,
          JSON.stringify(Array.from(this.value.entries()))
        );
      } catch (err) {
        // ignored
      }
    }
  }
}
