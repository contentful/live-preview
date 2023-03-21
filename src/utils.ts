/**
 * Sends the given message to the editor
 * enhances it with the information necessary to be accepted
 */
export function sendMessageToEditor(data: Record<string, unknown>): void {
  window.top?.postMessage(
    {
      from: 'live-preview',
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
