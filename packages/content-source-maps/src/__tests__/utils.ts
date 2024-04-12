import { get } from 'json-pointer';
import { expect } from 'vitest';
import type { Asset, EntrySkeletonType } from 'contentful';
import { decode } from '../encode.js';
import type {
  SourceMapMetadata,
  CPAContentSourceMaps,
  CPAEntry,
  CPAEntryCollection,
  ContentSourceMapsLookup,
  ExtendedAssetSys,
  ExtendedSys,
} from '../types.js';

type Mappings = Record<string, SourceMapMetadata | Record<string, SourceMapMetadata> | undefined>;

type EncodedResponse =
  | {
      [key: string]: string;
    }
  | Array<{ [key: string]: string }>;

export function testEncodingDecoding(
  encodedResponse:
    | EncodedResponse
    | CPAEntryCollection<EntrySkeletonType>
    | CPAEntry<EntrySkeletonType>,
  mappings: Mappings,
) {
  for (const [key, expectedValue] of Object.entries(mappings)) {
    const encodedValue = get(encodedResponse, key);
    const decodedValue = decode(encodedValue);
    expect(decodedValue).toEqual(expectedValue);
  }
}

export function createEntry({
  id,
  contentType,
  fields,
  locale,
  contentSourceMaps,
  contentSourceMapsLookup,
}: {
  id: string;
  contentType: string;
  fields: Record<string, unknown>;
  locale?: string;
  contentSourceMaps?: CPAContentSourceMaps;
  contentSourceMapsLookup?: ContentSourceMapsLookup;
}): CPAEntry {
  const sys: ExtendedSys = {
    createdAt: '2024-02-16T12:44:21.109Z',
    updatedAt: '2024-02-16T12:44:21.109Z',
    space: {
      sys: {
        type: 'Link',
        linkType: 'Space',
        id: 'spaceId',
      },
    },
    type: 'Entry',
    id,
    revision: 0,
    environment: {
      sys: {
        type: 'Link',
        linkType: 'Environment',
        id: 'master',
      },
    },
    contentType: {
      sys: {
        type: 'Link',
        linkType: 'ContentType',
        id: contentType,
      },
    },
    locale,
    contentSourceMaps,
    contentSourceMapsLookup,
  };

  const entry: CPAEntry = {
    metadata: { tags: [] },
    sys,
    fields,
  };

  return entry;
}

export function createAsset({
  id,
  fields,
  contentSourceMaps,
}: {
  id: string;
  fields: Record<string, unknown>;
  contentSourceMaps?: CPAContentSourceMaps;
}): Asset {
  const sys: ExtendedAssetSys = {
    createdAt: '2024-02-16T12:44:21.109Z',
    updatedAt: '2024-02-16T12:44:21.109Z',
    space: {
      sys: {
        type: 'Link',
        linkType: 'Space',
        id: 'spaceId',
      },
    },
    type: 'Asset',
    id,
    revision: 0,
    environment: {
      sys: {
        type: 'Link',
        linkType: 'Environment',
        id: 'master',
      },
    },
    contentSourceMaps,
  };

  const entry: Asset = {
    metadata: { tags: [] },
    sys,
    fields: {
      file: {
        'en-US': {
          url: '//images.ctfassets.net/spaceId/assetId/bc6fcc7941eaa36d5fda445fc09a7c33/Filename.jpg',
          details: {
            size: 1570880,
            image: {
              width: 1400,
              height: 2000,
            },
          },
          fileName: 'Filename.jpg',
          contentType: 'image/jpeg',
        },
      },
      ...fields,
    },
  };

  return entry;
}

export function createCPAEntryCollection({
  items,
  includes,
  contentSourceMapsLookup,
}: {
  items: CPAEntry[];
  includes?: { Entry?: CPAEntry[]; Asset?: Asset[] };
  contentSourceMapsLookup?: ContentSourceMapsLookup;
}): CPAEntryCollection {
  return {
    sys: {
      type: 'Array',
      contentSourceMapsLookup,
    },
    total: items.length + (includes?.Entry?.length ?? 0) + (includes?.Asset?.length ?? 0),
    skip: 0,
    limit: 100,
    items,
    includes,
  };
}
