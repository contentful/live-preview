import pkg from '../../package.json';
import { LIVE_PREVIEW_SDK_SOURCE } from '../constants.js';
import type { EditorMessage, MessageFromSDK } from '../messages.js';
import { PostMessageMethods } from '../messages.js';
import { debug } from './debug.js';

/**
 * Sends the given message to the editor
 * enhances it with the information necessary to be accepted
 */
export function sendMessageToEditor(
  method: PostMessageMethods,
  data: EditorMessage,
  targetOrigin: string[],
): void {
  const message = {
    ...data,
    method,
    source: LIVE_PREVIEW_SDK_SOURCE,
    location: window.location.href,
    version: pkg.version,
  } as MessageFromSDK;

  debug.log(`Send message`, message);

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

/** Detects if the current page is shown inside an iframe */
export function isInsideIframe(): boolean {
  try {
    return window.top?.location.href !== window.location.href;
  } catch (err) {
    // window.top.location.href is not accessable for non same origin iframes
    return true;
  }
}
