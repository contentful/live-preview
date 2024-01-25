import { vercelStegaDecode, vercelStegaEncode } from '@vercel/stega';

export type SourceMapMetadata = {
  origin: string;
  href: string;
  cf: {
    space: string;
    environment: string;
    entity: string;
    entityType: 'Entry' | 'Asset';
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
