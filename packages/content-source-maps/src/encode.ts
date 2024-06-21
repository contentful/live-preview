import {
  vercelStegaCombine,
  vercelStegaDecode,
  vercelStegaEncode,
  vercelStegaSplit,
} from '@vercel/stega';

import type { SourceMapMetadata } from './types.js';

export function combine(text: string, metadata: SourceMapMetadata): string {
  return vercelStegaCombine(text, metadata);
}

export function encode(metadata: SourceMapMetadata): string {
  return vercelStegaEncode(metadata);
}

export function decode(text: string): SourceMapMetadata | undefined {
  return vercelStegaDecode(text);
}

export function splitEncoding(text: string): {
  /** The original string with encoded substring removed */
  cleaned: string;
  /** The encoded substring from the original string */
  encoded: string;
} {
  return vercelStegaSplit(text);
}
