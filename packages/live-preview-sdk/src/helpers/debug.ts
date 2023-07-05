let DEBUG = false;

/** Enable the internal debug logs for the SDK */
export function setDebugMode(flag: boolean): void {
  DEBUG = flag;
}

const log =
  (level: 'error' | 'log' | 'warn'): typeof console.log =>
  (...args) => {
    if (DEBUG) {
      console[level](...args);
    }
  };

/** Wrapper around `console` functions to output only if the debug mode is enabled */
export const debug = {
  error: log('error'),
  warn: log('warn'),
  log: log('log'),
};
