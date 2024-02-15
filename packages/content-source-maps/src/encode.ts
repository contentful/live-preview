import { vercelStegaDecode, vercelStegaEncode, vercelStegaSplit } from '@vercel/stega';

export type SourceMapMetadata = {
  origin: string;
  href: string;
  contentful: {
    space: string;
    environment: string;
    entity: string;
    entityType: string;
    field: string;
    locale: string;
  };
};

export function encode(metadata: SourceMapMetadata): string {
  return vercelStegaEncode(metadata);
}

export function decode(text: string): SourceMapMetadata | undefined {
  return vercelStegaDecode(text);
}

export function split(text: string): {
  /** The original string with encoded substring removed */
  cleaned: string;
  /** The encoded substring from the original string */
  encoded: string;
} {
  return vercelStegaSplit(text);
}
