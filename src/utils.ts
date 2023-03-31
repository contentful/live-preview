import { ContentFields, EntryProps } from 'contentful-management/types';

import type { Entity, MessageAction } from './types';

/**
 * Sends the given message to the editor
 * enhances it with the information necessary to be accepted
 */
export function sendMessageToEditor(action: MessageAction, data: Record<string, unknown>): void {
  window.top?.postMessage(
    {
      from: 'live-preview',
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

export function isPrimitiveField(field: ContentFields): boolean {
  const types = new Set(['Symbol', 'Text', 'Integer', 'Boolean', 'Date', 'Location', 'Object']);

  if (types.has(field.type)) {
    return true;
  }

  // Array of Symbols
  if (field.type === 'Array' && field.items?.type === 'Symbol') {
    return true;
  }

  return false;
}

export function updatePrimitiveField(
  modified: Entity,
  update: EntryProps,
  name: string,
  locale: string
): void {
  if (name in modified) {
    modified[name] = update.fields?.[name]?.[locale] ?? null;
  }
}
